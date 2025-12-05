import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DubizzleService } from '../dubizzle.service';

@Injectable()
export class DubizzleScrapperService implements OnModuleInit {
  private logger = new Logger();
  constructor(@Inject() private dubizzle: DubizzleService) {}
  onModuleInit() {}
  getVacancies() {
    const url = `https://jobs.dubizzle.com/svc/ats/api/v1/listing?status=live`;
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
    const { data: vacancies } = await this.getVacancies();
    this.logger.log(vacancies);
  }
}
