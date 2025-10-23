import { Module } from '@nestjs/common';
import { DubizzleService } from './dubizzle.service';
import { DubizzleController } from './dubizzle.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      baseURL: '[https://jobs.dubizzle.com](https://jobs.dubizzle.com)',
      timeout: 5000, // 5 seconds timeout
      maxRedirects: 5,
      // You could also add default headers like Authorization here if needed
    }),
  ],
  controllers: [DubizzleController],
  providers: [DubizzleService],
  exports: [DubizzleService],
})
export class DubizzleModule {}
