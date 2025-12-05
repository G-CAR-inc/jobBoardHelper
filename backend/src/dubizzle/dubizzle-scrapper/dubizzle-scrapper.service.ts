import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DubizzleService } from '../dubizzle.service';
import { normalDistribution } from '../../utils/shared/srared.utils';

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
    return this.dubizzle.fetch({ url, timeout: this.random(), referer });
  }
  getApplies(props: { vacancyIds: string[] }) {
    const { vacancyIds } = props;

    return Promise.all(
      vacancyIds.map((vacancyId) => {
        const url = `https://jobs.dubizzle.com/svc/ats/api/v4/application?job_listing=${vacancyId}&is_in_pipeline=1&sort_by=created_at`;
        return this.dubizzle.fetch({ url });
      }),
    );
  }
  async scrap() {
    let page = 1;
    const { data: vacancies } = await this.getVacancies({ status: 'expired', page });
    // vacancies.results = vacancies.results.length;
    const arr: any[] = [];
    let next: string | null = vacancies.next;
    do {
      try {
        const { data: vacancies } = await this.getVacancies({ page, status: 'expired' });

        const { results, next: nextUrl } = vacancies;
        arr.push(...results);
        this.logger.warn({ nextUrl });
        next = nextUrl;
        page++;
      } catch (e) {}
    } while (next);
    return arr;
  }
}
