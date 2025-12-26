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
  async analyze() {
    const jobApplications = await this.repo.getAllJobApplications();
    this.logger.log(`Analyzing ${jobApplications.length} applications...`);

    const results: any[] = [];

    for (const app of jobApplications) {
      try {
        const { applicant } = app;

        if (!applicant.cvUrl) {
          this.logger.warn(`Applicant ${applicant.id} has no CV URL. Skipping.`);
          continue;
        }

        const cvBuffer = await this.downloadCv(applicant.cvUrl);
        const mimeType = 'application/pdf';

        // Call Gemini and get the raw result object (not just text)
        const { text, usageMetadata } = await this.analyzeCvWithGemini(cvBuffer, mimeType, applicant.age);

        // Parse JSON
        let analysisData;
        try {
          const cleanedText = text.replace(/```json|```/g, '').trim();
          analysisData = JSON.parse(cleanedText);
        } catch (e) {
          this.logger.error(`Failed to parse JSON for app ${app.id}`, e);
          continue;
        }

        // Prepare Data for Saving
        const ageVerdict = applicant.age !== null ? true : analysisData.isAgeBetween24And65 === true;

        const estimatedAge = applicant.age !== null ? applicant.age : analysisData.estimatedAge;

        const flattenedData = {
          // Verdicts
          ageVerdict: ageVerdict,
          driverLicenseVerdict: !!analysisData.hasUaeLicense,
          residenceVerdict: !!analysisData.isResident,
          visaVerdict: !!analysisData.hasValidVisa,

          // Extracted Data
          estimatedAge: estimatedAge || null,
          visaStatus: analysisData.visaType || null,

          // Reasons
          ageReason: analysisData.ageReason || null,
          driverLicenseReason: analysisData.licenseReason || null,
          residenceReason: analysisData.residenceReason || null,
          visaReason: analysisData.visaReason || null,

          // Token Usage
          totalTokens: usageMetadata?.totalTokenCount || 0,

          // Raw
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
      
      1. UAE Driving License: 
         - boolean "hasUaeLicense". True if explicit or strongly implied by roles (Driver, Sales).
         - string "licenseReason".
      
      2. Residence Status:
         - boolean "isResident". True if currently in UAE (address/phone).
         - string "residenceReason".

      3. Visa Status:
         - boolean "hasValidVisa". False if "Student", "N/A", or outside UAE. True if "Employment", "Residence", "Freelance", "Dependent".
         - string "visaType". Extract the specific text (e.g. "Employment Visa", "Visit Visa", "Golden Visa").
         - string "visaReason".
    `;

    const ifAgeAnalyzisIsRequired = currentAge === null;
    if (ifAgeAnalyzisIsRequired) {
      promptText += `
      4. Age Analysis:
         - number "estimatedAge". Estimate based on education/work timeline.
         - boolean "isAgeBetween24And65".
         - string "ageReason".
      `;
    }

    promptText += `
      Output ONLY raw JSON:
      {
        "hasUaeLicense": boolean, "licenseReason": string,
        "isResident": boolean, "residenceReason": string,
        "hasValidVisa": boolean, "visaType": string, "visaReason": string,
       ${ifAgeAnalyzisIsRequired ? `"estimatedAge": number, "isAgeBetween24And65": boolean, "ageReason": string` : ''}
      }
    `;

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [filePart, { text: promptText }] }],
    });

    const response = result.response;

    // SAFELY EXTRACT TEXT
    // Handle cases where candidates might be missing or text structure varies
    const candidate = response.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0];
    const text = textPart?.text || '';

    return {
      text: text,
      usageMetadata: response.usageMetadata,
    };
  }
}
