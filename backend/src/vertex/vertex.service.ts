import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { VertexRepository } from './repositories/vertex-repo.repository';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { VertexAI, GenerativeModel, Part } from '@google-cloud/vertexai';
import { firstValueFrom } from 'rxjs';
import path from 'path';

export interface LLMAnalysisResponse {
  hasUaeLicense: boolean;
  licenseReason: string;

  // Age Fields (Optional)
  estimatedAge?: number;
  isAgeBetween24And65?: boolean;
  ageReason?: string;

  // Nationality Fields (Optional)
  nationality?: string | null;
  nationalityReason?: string;
}

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
    this.logger.log(`Analyzing ${jobApplications.length} applications...`);

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

        // 2. Call Gemini
        const { text, usageMetadata } = await this.analyzeCvWithGemini(cvBuffer, mimeType, {
          age: applicant.age,
          nationality: applicant.nationality,
        });

        // 3. Parse JSON with Type Safety
        let analysisData: LLMAnalysisResponse;
        try {
          const cleanedText = text.replace(/```json|```/g, '').trim();
          analysisData = JSON.parse(cleanedText) as LLMAnalysisResponse;
        } catch (e) {
          this.logger.error(`Failed to parse JSON for app ${app.id}`, e);
          continue;
        }

        // 4. Determine Verdicts & Prepare Data

        // --- Age Logic ---
        const dbHasAge = applicant.age !== null;
        const ageVerdict = dbHasAge ? true : analysisData.isAgeBetween24And65 === true;
        const estimatedAge = dbHasAge ? applicant.age : analysisData.estimatedAge;

        const ageReason = dbHasAge ? null : analysisData.ageReason || null;

        // --- Nationality Logic ---
        const dbHasNationality = !!applicant.nationality;
        const finalNationality = dbHasNationality ? applicant.nationality : analysisData.nationality;
        const nationalityVerdict = finalNationality ? !['Pakistani', 'Bangladeshi'].includes(finalNationality!) : true;

        const nationalityReason = dbHasNationality ? null : analysisData.nationalityReason || null;

        // --- Visa Logic ---
        const hasValidVisa = !!applicant.visaStatus;

        // --- Residence Logic ---
        const isUaeResident = applicant.country === 'United Arab Emirates';


        const flattenedData = {
          // Verdicts
          ageVerdict,
          driverLicenseVerdict: !!analysisData.hasUaeLicense,
          residenceVerdict: isUaeResident,
          visaVerdict: hasValidVisa,
          nationalityVerdict,

          // Extracted Data
          estimatedAge: estimatedAge || null,
          nationality: finalNationality || null,

          // Reasons
          ageReason, // Now strictly string | null
          driverLicenseReason: analysisData.licenseReason || null,
          nationalityReason, // Now strictly string | null

          // Token Usage
          totalTokens: usageMetadata?.totalTokenCount || 0,

          // Raw Response
          rawResponse: analysisData as any,
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

  private async analyzeCvWithGemini(
    fileBuffer: Buffer,
    mimeType: string,
    optionalAspectsToInvestigate?: {
      age?: number | null;
      nationality?: string | null;
    },
  ) {
    const filePart: Part = {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: mimeType,
      },
    };

    let promptText = `
      You are an expert HR Recruiter. Analyze the attached CV and extract specific information in JSON format.
      
      Task 1: License Analysis.
      Question: Does the candidate have a UAE Driving License? 
      - If explicitly mentioned, set "hasUaeLicense" to true.
      - If NOT mentioned but roles imply it (Driver in UAE), infer true.
      - Provide a brief reasoning in "licenseReason".
    `;

    const needsAgeAnalysis = !optionalAspectsToInvestigate?.age;
    const needsNationalityAnalysis = !optionalAspectsToInvestigate?.nationality;

    if (needsAgeAnalysis) {
      promptText += `
        Task 2: Age Analysis (Age is unknown).
        - Estimate if the candidate is currently between 24 and 65 years old based on graduation year (Bachelor's ~22yo) and experience.
        - Set "isAgeBetween24And65" to true if they fall in this range.
        - Output "estimatedAge" as a number.
        - Provide "ageReason".
      `;
    }

    if (needsNationalityAnalysis) {
      promptText += `
        Task 3: Nationality Analysis (Nationality is unknown).
        - Scan the CV for explicit mentions of nationality, citizenship, or passport.
        - If not explicitly stated, attempt to infer from phone number country codes or address, but be conservative.
        - Set "nationality" to the extracted string (e.g., "Indian", "Pakistani", "British") or null if undetermined.
        - Provide "nationalityReason".
      `;
    }

    promptText += `
      Output ONLY raw JSON object (no markdown) with this structure:
      {
        "hasUaeLicense": boolean, 
        "licenseReason": "string"`;

    if (needsAgeAnalysis) {
      promptText += `,
        "estimatedAge": number, 
        "isAgeBetween24And65": boolean, 
        "ageReason": "string"`;
    }

    if (needsNationalityAnalysis) {
      promptText += `,
        "nationality": string | null,
        "nationalityReason": "string"`;
    }

    promptText += `
      }`;

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
