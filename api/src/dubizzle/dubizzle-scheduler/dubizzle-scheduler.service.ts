import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DubizzleService } from '../dubizzle.service';

@Injectable()
export class DubizzleSchedulerService {
  private readonly logger = new Logger(DubizzleSchedulerService.name);

  constructor(private readonly dubizzleService: DubizzleService) {}

  //   @Cron('*/15 * * * * *')
  //   handleTestLog() {
  //     this.logger.log(` [TEST CRON] Current Date: ${new Date().toISOString()}`);
  //   }
  @Cron('0 */2 * * *') // Runs at minute 0 past every 2nd hour
  async handleScheduledVisit() {
    this.logger.log(' [CRON] Starting scheduled job: visitJobsDomain');
    try {
      await this.dubizzleService.visitJobsDomain();
      this.logger.log(' [CRON] Completed scheduled job: visitJobsDomain');
    } catch (error) {
      this.logger.error(' [CRON] Failed to run scheduled job', error);
    }
  }
}
