import { Module } from '@nestjs/common';
import { PuppeteerService } from './puppeteer.service';

@Module({
  providers: [PuppeteerService],
})
export class PuppeteerModule {}
