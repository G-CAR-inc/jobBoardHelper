import { Module } from '@nestjs/common';
import { HyperSdkService } from './hyper-sdk.service';

@Module({
  providers: [HyperSdkService],
  exports: [HyperSdkService],
})
export class HyperSdkModule {}
