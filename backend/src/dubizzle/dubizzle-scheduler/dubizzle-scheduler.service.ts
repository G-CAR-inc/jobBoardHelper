import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
// import { DubizzleService } from '../dubizzle.service';
import { DubizzleScrapperService } from '../dubizzle-scrapper/dubizzle-scrapper.service';
import { normalDistribution, sleep } from '../../utils/shared/srared.utils';

@Injectable()
export class DubizzleSchedulerService {
  private readonly logger = new Logger(DubizzleSchedulerService.name);
  private random = normalDistribution(5, 1.2);

  constructor(
    // private readonly dubizzleService: DubizzleService,
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
    '55 6-22/1 * * *',
    //   {
    //   timeZone: 'Asia/Dubai',
    // }
  )
  async handleScheduledScraping() {
    this.logger.log(' [CRON] Starting scheduled job: dubizzleScraper.start()');
    try {
      const timeout = Math.floor(this.random() * 60) + 15;
      this.logger.log(`[TIMEOUT] sleeping for ${timeout} sec`);
      await sleep(timeout);
      await this.dubizzleScraper.start();
      this.logger.log(' [CRON] Completed scheduled job: dubizzleScraper.start()');
    } catch (error) {
      this.logger.error(' [CRON] Failed to run scheduled job: dubizzleScraper.start()', error);
    }
  }
}
