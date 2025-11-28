import { Module } from '@nestjs/common';
import { FetchService } from './fetch.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://jobs.dubizzle.com',
      timeout: 5000, // 5 seconds timeout
      maxRedirects: 5,
      // You could also add default headers like Authorization here if needed
    }),
  ],
  providers: [FetchService],
})
export class FetchModule {}
