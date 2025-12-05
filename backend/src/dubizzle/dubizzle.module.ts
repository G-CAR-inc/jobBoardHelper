import { Module } from '@nestjs/common';
import { DubizzleService } from './dubizzle.service';
import { DubizzleController } from './dubizzle.controller';
import { HttpModule } from '@nestjs/axios';
import { BrowserSessionRepository } from './repositories/browser-session.repository';
import { BypassRepository } from './repositories/bypass.repository';
import { DubizzleSchedulerService } from './dubizzle-scheduler/dubizzle-scheduler.service';
import { DubizzleScrapperService } from './dubizzle-scrapper/dubizzle-scrapper.service';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://jobs.dubizzle.com',
      timeout: 5000, // 5 seconds timeout
      maxRedirects: 5,
      // proxy:{''}
      // You could also add default headers like Authorization here if needed
    }),
  ],
  controllers: [DubizzleController],
  providers: [DubizzleService, BypassRepository, DubizzleSchedulerService, DubizzleScrapperService],
  exports: [DubizzleService],
})
export class DubizzleModule {}
