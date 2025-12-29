import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { VertexRepository } from './repositories/vertex-repo.repository';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { VertexAI, GenerativeModel, Part } from '@google-cloud/vertexai';
import { firstValueFrom } from 'rxjs';
import path from 'path';

@Injectable()
export class VertexService implements OnModuleInit {
  private logger: Logger = new Logger(VertexService.name);
  private vertexAI: VertexAI;
  private model: GenerativeModel;

  constructor(
    @Inject() private repo: VertexRepository,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}
  onModuleInit() {
    const project = this.config.getOrThrow<string>('GCP_PROJECT_ID');
    const keyFilename = path.join(process.cwd(), this.config.getOrThrow<string>('VERTEX_API_TOKEN'));
    const model = this.config.getOrThrow<string>('VERTEX_AI_MODEL');

    this.vertexAI = new VertexAI({
      project,
      googleAuthOptions: { keyFilename },
    });
    this.model = this.vertexAI.getGenerativeModel({ model });
  }
  async analyze(force?: boolean) {
    const jobApplications = await this.repo.getAllJobApplications(force);
    this.logger.log(`Analyzing ${jobApplications.length} isForced: ${force} applications...`);
    this.logger.log(jobApplications.filter((app) => !app.applicant.nationality));
    return;
    const results: any[] = [];

    for (const app of jobApplications) {
      try {
        const { applicant } = app;

        if (!applicant.cvUrl) {
          this.logger.warn(`Applicant ${applicant.id} has no CV URL. Skipping.`);
          continue;
        }

        // 1. Download CV
        const cvBuffer = await this.downloadCv(applicant.cvUrl);
        const mimeType = 'application/pdf';

        // 2. Call Gemini (Optimized: Only asks for License & Age)
        const { text, usageMetadata } = await this.analyzeCvWithGemini(cvBuffer, mimeType, applicant.age);

        // 3. Parse JSON
        let analysisData;
        try {
          const cleanedText = text.replace(/```json|```/g, '').trim();
          analysisData = JSON.parse(cleanedText);
        } catch (e) {
          this.logger.error(`Failed to parse JSON for app ${app.id}`, e);
          continue;
        }

        // 4. Determine Verdicts (Hybrid: DB + LLM)

        // AGE: Trust DB if present, otherwise use LLM
        const ageVerdict = applicant.age !== null ? true : analysisData.isAgeBetween24And65 === true;
        const estimatedAge = applicant.age !== null ? applicant.age : analysisData.estimatedAge;

        // RESIDENCE: Trust DB
        const isUaeResident = applicant.country === 'United Arab Emirates';

        // VISA: Trust DB
        const hasValidVisa = !!applicant.visaStatus;

        const flattenedData = {
          // Verdicts
          ageVerdict: ageVerdict,
          driverLicenseVerdict: !!analysisData.hasUaeLicense,
          residenceVerdict: !!isUaeResident,
          visaVerdict: hasValidVisa,

          // Extracted Data
          estimatedAge: estimatedAge || null,
          // Reasons
          ageReason: analysisData.ageReason || null,
          driverLicenseReason: analysisData.licenseReason || null,
          residenceReason: applicant.country || 'Unknown',
          visaReason: applicant.visaStatus || 'Unknown',

          // Token Usage
          totalTokens: usageMetadata?.totalTokenCount || 0,

          // Raw Response (Includes the LLM analysis part)
          rawResponse: analysisData,
        };

        await this.repo.saveAnalysis(app.id, flattenedData);

        this.logger.log(`Saved analysis for ${applicant.firstName} ${applicant.lastName}`);
        results.push({ applicationId: app.id, ...flattenedData });
      } catch (error) {
        this.logger.error(`Failed to analyze application ${app.id}: ${error.message}`);
      }
    }

    return results;
  }

  private async downloadCv(url: string): Promise<Buffer> {
    const response = await firstValueFrom(this.http.get(url, { responseType: 'arraybuffer' }));
    return Buffer.from(response.data);
  }

  private async analyzeCvWithGemini(fileBuffer: Buffer, mimeType: string, currentAge: number | null) {
    const filePart: Part = {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: mimeType,
      },
    };

    let promptText = `
      You are an expert HR Recruiter. Analyze the attached CV and extract specific information in JSON format.
      
      Question 1: Does the candidate have a UAE Driving License? 
      - If explicitly mentioned, set "hasUaeLicense" to true.
      - If NOT mentioned but roles imply it (Driver in UAE), infer true.
      - Provide a brief reasoning in "licenseReason".
    `;

    const ifAgeAnalyzisIsRequired = currentAge === null;
    if (ifAgeAnalyzisIsRequired) {
      promptText += `
        Question 2: Age Analysis (Age is unknown).
        - Estimate if the candidate is currently between 24 and 65 years old based on graduation year (Bachelor's ~22yo) and experience.
        - Set "isAgeBetween24And65" to true if they fall in this range.
        - Output "estimatedAge" as a number.
        - Provide "ageReason".
      `;
    }

    promptText += `
      Output ONLY raw JSON object (no markdown) with this structure:
      {
        "hasUaeLicense": boolean, 
        "licenseReason": "string",
       ${
         ifAgeAnalyzisIsRequired
           ? `"estimatedAge": number, 
            "isAgeBetween24And65": boolean, 
            "ageReason": "string"`
           : ''
       }
      }
    `;

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [filePart, { text: promptText }] }],
    });

    const response = result.response;
    const candidate = response.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0];
    const text = textPart?.text || '';

    return {
      text: text,
      usageMetadata: response.usageMetadata,
    };
  }
}
