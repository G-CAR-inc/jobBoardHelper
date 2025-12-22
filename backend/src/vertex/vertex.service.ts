import { Inject, Injectable, Logger } from '@nestjs/common';
import { VertexRepository } from './repositories/vertex-repo.repository';

@Injectable()
export class VertexService {
  private logger: Logger = new Logger(VertexService.name);
  constructor(@Inject() private repo: VertexRepository) {}

  async test() {
    const jobApplications = await this.repo.getAllJobApplications();
    this.logger.log(jobApplications, jobApplications.length);
    return jobApplications;
  }
}
