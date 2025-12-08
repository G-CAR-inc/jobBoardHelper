import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DubizzleService } from '../dubizzle.service';
import { DubizzleScrapperService } from '../dubizzle-scrapper/dubizzle-scrapper.service';

@Injectable()
export class DubizzleSchedulerService {
  private readonly logger = new Logger(DubizzleSchedulerService.name);

  constructor(
    private readonly dubizzleService: DubizzleService,
    private readonly dubizzleScraper: DubizzleScrapperService,
  ) {}

  //   @Cron('*/15 * * * * *')
  //   handleTestLog() {
  //     this.logger.log(` [TEST CRON] Current Date: ${new Date().toISOString()}`);
  //   }

  // @Cron('0 */2 * * *') // Runs at minute 0 past every 2nd hour
  // async handleScheduledVisit() {
  //   this.logger.log(' [CRON] Starting scheduled job: visitJobsDomain');
  //   try {
  //     await this.dubizzleService.visitJobsDomain();
  //     this.logger.log(' [CRON] Completed scheduled job: visitJobsDomain');
  //   } catch (error) {
  //     this.logger.error(' [CRON] Failed to run scheduled job', error);
  //   }
  // }
  @Cron(
    '55 6-20/2 * * *',
    //   {
    //   timeZone: 'Asia/Dubai',
    // }
  )
  async handleScheduledScraping() {
    this.logger.log(' [CRON] Starting scheduled job: scrapeWithRandDelay');
    try {
      await this.dubizzleScraper.scrapeWithRandDelay();
      this.logger.log(' [CRON] Completed scheduled job: scrapeWithRandDelay');
    } catch (error) {
      this.logger.error(' [CRON] Failed to run scheduled job scrapeWithRandDelay', error);
    }
  }
}
