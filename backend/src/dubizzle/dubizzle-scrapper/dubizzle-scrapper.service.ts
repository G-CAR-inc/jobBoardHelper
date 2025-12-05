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
    const { data: vacancies } = await this.getExpiredVacancies();
    vacancies.results = vacancies.results.length;
    return vacancies;
  }
}
