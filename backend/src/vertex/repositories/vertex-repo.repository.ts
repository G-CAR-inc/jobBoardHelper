import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VertexRepository {
  constructor(@Inject() private prisma: PrismaService) {}

  getAllJobListings() {
    return this.prisma.jobListing.findMany({
      select: {
        id: true,
        description: true,
        salary: true,
      },
    });
  }

  getAllJobApplications() {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 10);

    return this.prisma.jobApplication.findMany({
      select: {
        id: true,
        applicant: true,
        appliedAt: true,
        jobId: true,
      },
      where: {
        // dbCreatedAt: {
        //   gte: oneHourAgo,
        // },
        analysis: {
            is: null
        },
        applicant: {
          nationality: {
            notIn: ['Pakistani', 'Bangladeshi'],
          },
          visaStatus: {
            notIn: ['Not Applicable', 'Student'],
          },
          AND: {
            OR: [
              { age: null },
              { age: { gte: 24, lte: 65 } },
            ],
          },
        },
      },
    });
  }

  async saveAnalysis(
    applicationId: string,
    data: {
        ageVerdict: boolean;
        driverLicenseVerdict: boolean;
        residenceVerdict: boolean;
        visaVerdict: boolean;
        
        estimatedAge: number | null;
        visaStatus: string | null;
        
        ageReason: string | null;
        driverLicenseReason: string | null;
        residenceReason: string | null;
        visaReason: string | null;
        
        totalTokens: number | null;

        rawResponse: any;
    }
  ) {
    return this.prisma.applicationAnalysis.create({
      data: {
        applicationId,
        ...data
      },
    });
  }
}