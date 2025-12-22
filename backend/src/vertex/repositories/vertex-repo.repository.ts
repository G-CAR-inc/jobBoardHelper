import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { equal } from 'assert';

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
        appliedAt: true, // This is the application time from the source
        jobId: true,
      },
      where: {
        dbCreatedAt: {
          gte: oneHourAgo,
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
              { age: { gte: 24, lte: 65 } }, // age є [24,65] U {null};
            ],
          },
        },
      },
    });
  }
}
