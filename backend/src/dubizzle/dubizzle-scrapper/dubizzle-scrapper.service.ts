import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DubizzleService } from '../dubizzle.service';
import { normalDistribution } from '../../utils/shared/srared.utils';
import { ApplicationResponce, JobApplication, JobListing, VacancyResponce } from '../types';
import { AxiosError } from 'axios';

@Injectable()
export class DubizzleScrapperService implements OnModuleInit {
  private logger = new Logger();
  private random: () => number;
  constructor(@Inject() private dubizzle: DubizzleService) {}
  onModuleInit() {
    const mu = 3;
    const sigma = 1;
    this.random = normalDistribution(mu, sigma);
  }
  getActiveVacancies() {
    const url = `https://jobs.dubizzle.com/svc/ats/api/v1/listing?status=live`;
    return this.dubizzle.fetch({ url });
  }
  getExpiredVacancies() {
    const url = `https://jobs.dubizzle.com/svc/ats/api/v1/listing?status=deleted%2Cexpired`;
    return this.dubizzle.fetch({ url });
  }
  getVacancies(props: { status?: 'active' | 'expired'; page: number }) {
    const { page, status } = props;
    let statusQuery = status == 'active' && `live`;
    if (!statusQuery) {
      statusQuery = status == 'expired' && 'deleted%2Cexpired';
    }
    if (!statusQuery) {
      statusQuery = 'live';
    }
    const referer: string = `https://jobs.dubizzle.com/ats/dashboard/?status=${status}&page=${page}`;
    const url = `https://jobs.dubizzle.com/svc/ats/api/v1/listing?status=${statusQuery}&page=${page}`;
    return this.dubizzle.fetch({ url, timeout: this.random(), referer }) as Promise<{ data: VacancyResponce }>;
  }
  getApplications(props: { page: number; jobId: string }) {
    const { page, jobId } = props;
    const status = 'live';

    const referer: string = `https://jobs.dubizzle.com/ats/dashboard/${jobId}/?candidate_type=is_in_pipeline&sort_by=created_at&status=${status}&page=${page}`;
    const url = `https://jobs.dubizzle.com/svc/ats/api/v4/application?job_listing=${jobId}&is_in_pipeline=1&sort_by=created_at&page=${page}`;
    return this.dubizzle.fetch({ url, timeout: this.random(), referer }) as Promise<{ data: ApplicationResponce }>;
  }
  async getAllVacancies(status: 'expired' | 'active') {
    let page = 1;
    // vacancies.results = vacancies.results.length;
    const jobListings: JobListing[] = [];
    let next: string | null = null;
    do {
      try {
        const { data: vacancies } = await this.getVacancies({ page, status });

        const { results, next: nextUrl } = vacancies;
        jobListings.push(...results);
        this.logger.warn({ nextUrl });
        next = nextUrl;
        page++;
      } catch (e: unknown) {
        this.logger.error(`Error while fetching vacancies:${(e as AxiosError).message}`);
        this.logger.warn(`retrying...`);
      }
    } while (next);
    return jobListings;
  }
  async getAllApplications(jobId: string) {
    this.logger.log(`fetching applies for  job:${jobId}`);
    let page = 1;
    const jobListings: JobApplication[] = [];
    let next: string | null = null;
    do {
      try {
        const { data: applications } = await this.getApplications({ page, jobId });

        const { results, next: nextUrl } = applications;
        jobListings.push(...results);
        this.logger.warn({ message:`[APPLICATION] page:${page} has been successfully fetched`,nextUrl });
        next = nextUrl;
        // if (page == 2) return jobListings;
        page++;
      } catch (e: unknown) {
        this.logger.error(`Error while fetching aplications:${(e as AxiosError).message}`);
        this.logger.warn(`retrying...`);
      }
    } while (next);
    return jobListings;
  }

  async scrape() {
    const mockVacancy: JobListing = {
      id: '99a83db6-1697-4f14-8283-4cc6172b55d1',
      legacy_id: 26164,
      legacy_uuid: '9ef4882c-34b5-47f7-a58f-77099539ea6d',
      created_at: '2025-10-16T09:08:34Z',
      updated_at: '2025-11-03T14:56:21.692292Z',
      expires_at: '2025-11-15T09:08:34Z',
      status: 'deleted',
      name: 'Limousine Hotel Supervisor',
      description:
        '<br>Responsibilities:<br><br>Supervise limousine services for hotel guests and VIP clients<br>Manage daily scheduling, dispatch, and driver assignments<br>Ensure smooth coordination between hotels and Limousine<br>Maintain high standards of service and professionalism<br>Handle guest inquiries and resolve issues effectively<br><br><br><br>Requirements:<br><br>Minimum 1–2 years of experience in limousine transportation and hotel industry<br>Strong knowledge of hotel operations and transportation services<br>Excellent communication and leadership skills<br>Ability to manage bookings, coordinate drivers, and ensure customer satisfaction<br>Willing to relocate to Dubai',
      data: {
        gender: 'any',
        salary: '2,000 - 3,999',
        industry: 'TR',
        language: ['english', 'hindi'],
        location: {
          name: ['UAE', 'Dubai', 'Umm Al Sheif'],
          name_i18n: {
            ar: ['الإمارات', 'دبي', 'أم الشيف'],
          },
        },
        commitment: 'Full Time',
        'remote-job': 'no',
        cv_required: true,
        absolute_url:
          'https://dubai.dubizzle.com/jobs/travel-hospitality/2025/10/16/limousine-hotel-supervisor-2-797---9ef4882c34b547f7a58f77099539ea6d/',
        company_name: 'Confidential',
        company_size: '51-200',
        relative_url: '/jobs/travel-hospitality/2025/10/16/limousine-hotel-supervisor-2-797---9ef4882c34b547f7a58f77099539ea6d/',
        education_level: 'Bachelors Degree',
        work_experience: '2-5 Years',
        hide_company_name: true,
        attributes_display_values: {
          salary: {
            ar: '2,000 - 3,999',
            en: '2,000 - 3,999',
          },
          commitment: {
            ar: 'دوام كامل',
            en: 'Full Time',
          },
          skill_level: {
            ar: '',
            en: '',
          },
          company_size: {
            ar: '51-200',
            en: '51-200',
          },
          education_level: {
            ar: 'بكالوريوس',
            en: 'Bachelors Degree',
          },
          work_experience: {
            ar: '2 - 5 سنوات',
            en: '2-5 Years',
          },
        },
        auto_reject_applicants_not_based_in_the_uae: 'no',
      },
      featured_status: 'not_featured',
      edit_url: 'https://dubai.dubizzle.com/place-an-ad/jobs/travel-hospitality/26164/edit/?uuid=9ef4882c-34b5-47f7-a58f-77099539ea6d',
      application_counts: {
        total: 106,
        applied: 28,
        offered: 0,
      },
      upgrade_url: 'https://dubai.dubizzle.com/place-an-ad/packages/jobs/travel-hospitality/listing/26164/plans',
      dpv_url: 'https://dubai.dubizzle.com/jobs/travel-hospitality/2025/10/16/limousine-hotel-supervisor-2-797---9ef4882c34b547f7a58f77099539ea6d/',
      category: {
        id: '8339e878-1ad4-4a62-a32f-b8a49f45b661',
        legacy_id: 2104,
        slug: 'travel-hospitality',
        full_slug: 'jobs/travel-hospitality',
      },
      pipeline: '0d30e496-4f4e-45f0-ba03-ebaafccbd848',
      relevancy: {
        work_experience: '2',
        education_level: '2',
        nationality: null,
        gender: 'any',
        location: {
          name: ['UAE', 'Dubai', 'Umm Al Sheif'],
          name_i18n: {
            ar: ['الإمارات', 'دبي', 'أم الشيف'],
          },
        },
        category: 'travel-hospitality_2104',
        percentage: 31,
      },
      company: 'Sahalat For Luxury Motor Vehicles  Services LLC',
      auto_reject_config: {
        gender: {
          enabled: false,
        },
        experience: {
          values: [
            {
              category: {
                id: '8339e878-1ad4-4a62-a32f-b8a49f45b661',
                slug: 'travel-hospitality',
                full_slug: 'jobs/travel-hospitality',
                legacy_id: 2104,
              },
              sub_category: [],
              maximum_experience: 99,
              minimum_experience: '2',
            },
          ],
          enabled: false,
        },
        nationality: {
          enabled: false,
        },
        qualification: {
          enabled: false,
        },
        screening_questions: {
          enabled: true,
        },
        auto_reject_applicants_not_based_in_the_uae: {
          enabled: false,
        },
      },
    };
    const vacancies = await this.getAllVacancies('active');
    // const vacancies = [mockVacancy];
    const applications: JobApplication[] = [];
    for (const job of vacancies) {
      const { id } = job;
      const localApplications = await this.getAllApplications(id);
      this.logger.log(localApplications[0]);
      applications.push(...localApplications);
    }

    this.logger.log({ message: 'pipeline simmulated', applications: applications.length });
  }
}
