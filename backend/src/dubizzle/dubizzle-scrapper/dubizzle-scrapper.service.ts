import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DubizzleService } from '../dubizzle.service';
import { normalDistribution } from '../../utils/shared/srared.utils';
import { ApplicationResponce, JobApplication, JobListing, JobListingResponce } from '../types';
import { AxiosError } from 'axios';
import { ScrappingRepository } from '../repositories/scrapping.repository';

@Injectable()
export class DubizzleScrapperService implements OnModuleInit {
  private logger = new Logger();
  private random: () => number;
  constructor(
    @Inject() private dubizzle: DubizzleService,
    @Inject() private repo: ScrappingRepository,
  ) {}
  onModuleInit() {
    const mu = 2;
    const sigma = 0.5;
    this.random = normalDistribution(mu, sigma);
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
    return this.dubizzle.fetch({ url, timeout: this.random(), referer }) as Promise<{ data: JobListingResponce }>;
  }
  getApplications(props: { page: number; jobId: string }) {
    const { page, jobId } = props;
    const status = 'live';

    const referer: string = `https://jobs.dubizzle.com/ats/dashboard/${jobId}/?candidate_type=is_in_pipeline&sort_by=created_at&status=${status}&page=${page}`;
    const url = `https://jobs.dubizzle.com/svc/ats/api/v4/application?job_listing=${jobId}&is_in_pipeline=1&sort_by=created_at&page=${page}`;
    return this.dubizzle.fetch({ url, timeout: this.random(), referer }) as Promise<{ data: ApplicationResponce }>;
  }
  async getAllJobs(status: 'expired' | 'active') {
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
  async getAllApplications(jobId: string, stopDate?: Date | null) {
    this.logger.log(`fetching applications for job:${jobId} (Newer than: ${stopDate?.toISOString() ?? 'ALL'})`);
    let page = 1;
    const applicationsList: JobApplication[] = [];
    let next: string | null = null;
    let stopFetching = false;

    do {
      try {
        const { data: applications } = await this.getApplications({ page, jobId });
        const { results, next: nextUrl } = applications;

        for (const app of results) {
          const appDate = new Date(app.created_at);

          // Optimization: If we hit a date older than or equal to our last sync, stop.
          if (stopDate && appDate.getTime() <= stopDate.getTime()) {
            stopFetching = true;
            this.logger.log(`[OPTIMIZATION] Found application from ${app.created_at}, stopping fetch.`);
            break;
          }

          applicationsList.push(app);
        }

        if (stopFetching) {
          break;
        }

        this.logger.warn({ message: `[APPLICATION] page:${page} fetched`, nextUrl });
        next = nextUrl;
        page++;
      } catch (e: unknown) {
        this.logger.error(`Error fetching applications: ${(e as AxiosError).message}`);
        this.logger.warn(`retrying...`);
        await new Promise((r) => setTimeout(r, 2000));
        if (page > 100) break; // Safety break
      }
    } while (next);

    return applicationsList;
  }

  // async scrape() {
  //   this.logger.log('Starting Scrape Process...');
  //   const jobs = await this.getAllJobs('active');
  //   this.logger.log(`Found ${jobs.length} active jobs`);

  //   for (const job of jobs) {
  //     await this.repo.upsertJob(job);

  //     // 1. Get the last recorded application date for this job
  //     const lastAppDate = await this.repo.getLastApplicationDate(job.id);

  //     // 2. Fetch only new applications
  //     const applications = await this.getAllApplications(job.id, lastAppDate);

  //     if (applications.length === 0) {
  //       this.logger.log(`[DB] No new applications for Job ${job.id}`);
  //       continue;
  //     }

  //     // 3. Save new applications
  //     for (const app of applications) {
  //       await this.repo.upsertApplication(app, job.id);
  //     }
  //     this.logger.log(`[DB] Saved ${applications.length} new applications for Job ${job.id}`);

  //     // 4. Determine the new latest date from the batch we just fetched
  //     const newLatestDate = applications.reduce((max, app) => {
  //       const current = new Date(app.created_at);
  //       return current > max ? current : max;
  //     }, new Date(0));

  //     // 5. Update the JobListing with the new cursor
  //     if (newLatestDate.getTime() > 0) {
  //       await this.repo.updateJobLastApplicationDate(job.id, newLatestDate);
  //     }
  //   }

  //   this.logger.log({ message: 'Pipeline simulated and data saved' });
  // }
  // --- PART 1: JOB HEALTH CHECK ---
  /**
   * 1) Fetches ALL currently 'active' (live) jobs from API.
   * 2) Updates them in DB (setting status = 'live').
   * 3) Compares API list vs DB list to find jobs that disappeared (expired).
   * 4) Updates missing jobs to 'expired' in DB.
   * 5) Returns IDs of these newly expired jobs.
   */
  async jobHealthCheck(): Promise<string[]> {
    this.logger.log('--- STARTING JOB HEALTH CHECK ---');

    // 1. Get Live Jobs from API
    const activeJobsApi = await this.getAllJobs('active');
    this.logger.log(`[API] Fetched ${activeJobsApi.length} active jobs.`);

    // 2. Upsert Active Jobs (Ensure DB knows they are live)
    for (const job of activeJobsApi) {
      await this.repo.upsertJob(job);
    }

    // 3. Get all jobs currently marked 'live' in the DB
    // Since we just upserted, this includes all API jobs + any stale jobs not returned by API
    const dbLiveJobIds = await this.repo.getLiveJobIds();

    const activeApiIds = new Set(activeJobsApi.map((j) => j.id));

    // 4. Compute Difference: Jobs in DB (live) but NOT in API (active)
    const expiredJobIds = dbLiveJobIds.filter((dbId) => !activeApiIds.has(dbId));

    if (expiredJobIds.length > 0) {
      this.logger.log(`[DIFF] Found ${expiredJobIds.length} jobs that are no longer active.`);

      // 5. Mark them as expired
      await this.repo.expireJobs(expiredJobIds);
    } else {
      this.logger.log('[DIFF] No expired jobs found.');
    }

    this.logger.log('--- HEALTH CHECK COMPLETE ---');
    return expiredJobIds;
  }
  /**
   * 1) Selects jobs to process: All 'live' jobs from DB + optional extra IDs (e.g., just expired ones).
   * 2) Fetches applications for these jobs (optimized).
   */
  async processAndSaveNewJobApplications(optionalJobIds: string[] = []) {
    this.logger.log(`--- STARTING APPLICATION SYNC (Extra IDs: ${optionalJobIds.length}) ---`);

    // 1. Get currently Live jobs from DB
    const liveJobsInDb = await this.repo.getLiveJobs();
    const liveJobIds = liveJobsInDb.map((j) => j.id);

    // 2. Combine with optional IDs (deduplicate)
    const jobsToProcess = Array.from(new Set([...liveJobIds, ...optionalJobIds]));
    this.logger.log(`Processing applications for ${jobsToProcess.length} total jobs.`);

    for (const jobId of jobsToProcess) {
      // 1. Get last sync date
      const lastAppDate = await this.repo.getLastApplicationDate(jobId);

      // 2. Fetch new applications only
      const applications = await this.getAllApplications(jobId, lastAppDate);

      if (applications.length === 0) {
        this.logger.log(`[DB] No new applications for Job ${jobId}`);
        continue;
      }

      // 3. Save applications
      for (const app of applications) {
        await this.repo.upsertApplication(app, jobId);
      }
      this.logger.log(`[DB] Saved ${applications.length} new applications for Job ${jobId}`);

      // 4. Update cursor
      const newLatestDate = applications.reduce((max, app) => {
        const current = new Date(app.created_at);
        return current > max ? current : max;
      }, new Date(0));

      if (newLatestDate.getTime() > 0) {
        await this.repo.updateJobLastApplicationDate(jobId, newLatestDate);
      }
    }
    this.logger.log('--- APPLICATION SYNC COMPLETE ---');
  }

  async scrape() {
    const expiredJobIds = await this.jobHealthCheck();

    await this.processAndSaveNewJobApplications(expiredJobIds);
  }
}
