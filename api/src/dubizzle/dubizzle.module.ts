import { Module } from '@nestjs/common';
import { DubizzleService } from './dubizzle.service';
import { DubizzleController } from './dubizzle.controller';
import { HttpModule } from '@nestjs/axios';
import { BrowserSessionRepository } from './repositories/browser-session.repository';
import { BypassRepository } from './repositories/bypass.repository';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://jobs.dubizzle.com',
      timeout: 5000, // 5 seconds timeout
      maxRedirects: 5,
      // You could also add default headers like Authorization here if needed
    }),
  ],
  controllers: [DubizzleController],
  providers: [DubizzleService, BrowserSessionRepository, BypassRepository],
  exports: [DubizzleService],
})
export class DubizzleModule {}
