// backend/src/dubizzle/repositories/scrapping.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobListing, JobApplication } from '../types'; // Import your interfaces
import { Prisma } from '@prisma/client';

@Injectable()
export class ScrappingRepository {
  private readonly logger = new Logger(ScrappingRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Saves or Updates a Job Listing
   */
  async upsertJob(job: JobListing) {
    try {
      const locationString = Array.isArray(job.data.location?.name) 
        ? job.data.location.name.join(', ') 
        : '';

      return await this.prisma.jobListing.upsert({
        where: { id: job.id },
        update: {
          status: job.status,
          updatedAt: new Date(),
          // Update volatile fields
          applicationCounts: undefined, // If you added this to schema
        },
        create: {
          id: job.id,
          legacyId: job.legacy_id,
          name: job.name,
          description: job.description,
          companyName: job.data.company_name,
          status: job.status,
          salary: job.data.salary,
          location: locationString,
          industry: job.data.industry,
          employmentType: job.data.commitment,
          educationLevel: job.data.education_level,
          workExperience: job.data.work_experience,
          postedAt: new Date(job.created_at),
          expiresAt: new Date(job.expires_at),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to upsert job ${job.id}`, error);
      throw error;
    }
  }

  /**
   * Saves Applicant and Link to Job
   */
  async upsertApplication(application: JobApplication, jobId: string) {
    try {
      const applicantData = application.applicant;
      const profile = applicantData.applicant_profile;

      // 1. Upsert Applicant First
      await this.prisma.applicant.upsert({
        where: { id: applicantData.id },
        update: {
          // Update profile details that might change over time
          currentPosition: profile.current_position?.value,
          currentCompany: profile.current_company,
          totalExperience: profile.total_work_experience,
          cvUrl: profile.cv_url,
          updatedAt: new Date(),
        },
        create: {
          id: applicantData.id,
          firstName: applicantData.first_name,
          lastName: applicantData.last_name,
          email: applicantData.email, // Note: Dubizzle might mask this in some responses
          phone: profile.job_phone_number,
          nationality: profile.nationality?.value,
          currentPosition: profile.current_position?.value,
          currentCompany: profile.current_company,
          educationLevel: profile.education_level?.value,
          salaryExpectation: profile.salary_expectations?.value,
          totalExperience: profile.total_work_experience,
          cvUrl: profile.cv_url,
          photoUrl: applicantData.photo_url,
        },
      });

      // 2. Upsert Application Link
      return await this.prisma.jobApplication.upsert({
        where: {
          jobId_applicantId: {
            jobId: jobId,
            applicantId: applicantData.id,
          },
        },
        update: {
          isRejected: application.is_rejected,
          isViewed: application.is_viewed,
          relevancyScore: application.relevancy_score,
        },
        create: {
          id: application.id,
          jobId: jobId,
          applicantId: applicantData.id,
          isRejected: application.is_rejected,
          isViewed: application.is_viewed,
          relevancyScore: application.relevancy_score,
          appliedAt: new Date(application.created_at),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to upsert application ${application.id}`, error);
      // We don't throw here to allow other applications in the loop to proceed
    }
  }
}