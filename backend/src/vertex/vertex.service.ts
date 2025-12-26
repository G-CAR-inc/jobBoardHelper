import { Inject, Injectable, Logger } from '@nestjs/common';
import { VertexRepository } from './repositories/vertex-repo.repository';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { VertexAI, GenerativeModel, Part } from '@google-cloud/vertexai';
import { firstValueFrom } from 'rxjs';
import path from 'path';

@Injectable()
export class VertexService {
  private logger: Logger = new Logger(VertexService.name);
  private vertexAI: VertexAI;
  private model: GenerativeModel;

  constructor(
    @Inject() private repo: VertexRepository,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.vertexAI = new VertexAI({
      project: this.configService.getOrThrow<string>('GCP_PROJECT_ID'),
   
      googleAuthOptions: {
        keyFilename: path.join(process.cwd(), 'vertex_api_gemini.json'),
      },
    });
    this.model = this.vertexAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
  }

  async analyze() {
    const jobApplications = await this.repo.getAllJobApplications();
    this.logger.log(`Analyzing ${jobApplications.length} applications...`);

    const results = [];

    for (const app of jobApplications) {
      try {
        const { applicant } = app;

        if (!applicant.cvUrl) {
          this.logger.warn(`Applicant ${applicant.id} has no CV URL. Skipping.`);
          continue;
        }

        // 1. Download CV
        const cvBuffer = await this.downloadCv(applicant.cvUrl!);
        const mimeType = 'application/pdf'; // Assuming PDF, you might want to detect this from headers
        this.logger.log(cvBuffer);
        // 2. Call Gemini
        const analysis = await this.analyzeCvWithGemini(cvBuffer, mimeType, applicant.age);

        this.logger.log(`Analysis for ${applicant.firstName} ${applicant.lastName}:`, analysis);

        // results.push({
        //   applicationId: app.id,
        //   applicantId: applicant.id,
        //   analysis,
        // });
        return;
      } catch (error) {
        this.logger.error(`Failed to analyze application ${app.id}: ${error.message}`);
      }
    }

    return results;
  }

  private async downloadCv(url: string): Promise<Buffer> {
    const response = await firstValueFrom(this.httpService.get(url, { responseType: 'arraybuffer' }));
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
      - If NOT explicitly mentioned, analyze their work experience. If they have worked in roles in the UAE that typically require driving (e.g., Sales Representative, Driver, Logistics), infer it as likely true.
      - Provide a brief reasoning in "licenseReason".
    `;

    const ifAgeAnalyzisIsRequired = currentAge === null;

    if (ifAgeAnalyzisIsRequired) {
      promptText += `
        Question 2: Investigate the candidate's age.
        - Step 1: Search for an explicit "Date of Birth", "DOB", or "Age" mentioned in the document.
        - Step 2: If not explicitly found, analyze the education timeline. Assume a candidate is approximately 18 upon High School graduation and 21-23 upon Bachelor's graduation. 
        - Step 3: Analyze the work history start date to corroborate the estimated age.
        - Output the "estimatedAge" as a number (e.g., 29). If it is completely impossible to determine, set to null.
        - Set "isAgeBetween24And65" to true if the estimated age is >= 24 and <= 65.
        - Provide the logic used in "ageReason" (e.g., "Born 1995" or "Bachelor's in 2018 implies approx 27-28 years old").
      `;
    }

    promptText += `
      Output ONLY a raw JSON object (no markdown formatting) with the following structure:
      {
        "hasUaeLicense": boolean,
        "licenseReason": "string",
       ${
         ifAgeAnalyzisIsRequired
           ? `"estimatedAge": number | null,
            "isAgeBetween24And65": boolean | null, 
            "ageReason": "string"`
           : ''
       }
      }
    `;

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [filePart, { text: promptText }] }],
    });

    // You might want to parse the result.response.text() here to ensure it's valid JSON
    // const responseText = result.response.text();
    // return JSON.parse(responseText.replace(/```json|```/g, ''));

    return result.response;
  }
}
