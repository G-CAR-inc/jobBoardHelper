import { Module } from '@nestjs/common';
import { PlaywrightService } from './playwright.service';
import { PlaywrightController } from './playwright.controller';


@Module({
  imports: [],
  providers: [PlaywrightService],
  controllers: [PlaywrightController],
})
export class PlaywrightModule {}
