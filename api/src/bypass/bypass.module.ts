import { Module } from '@nestjs/common';
import { BypassService } from './bypass.service';

@Module({
  providers: [BypassService]
})
export class BypassModule {}
