import { Module } from '@nestjs/common';
import { DubizzleService } from './dubizzle.service';
import { DubizzleController } from './dubizzle.controller';
import { HttpModule } from '@nestjs/axios';
import { BypassRepository } from './repositories/bypass.repository';
import { DubizzleSchedulerService } from './dubizzle-scheduler/dubizzle-scheduler.service';
import { DubizzleScrapperService } from './dubizzle-scrapper/dubizzle-scrapper.service';
import { ScrappingRepository } from './repositories/scrapping.repository';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://jobs.dubizzle.com',
      // timeout: 10000, // 5 seconds timeout
      // maxRedirects: 5,
    }),
  ],
  controllers: [DubizzleController],
  providers: [DubizzleService, BypassRepository, DubizzleSchedulerService, DubizzleScrapperService, ScrappingRepository],
  exports: [DubizzleService],
})
export class DubizzleModule {}
