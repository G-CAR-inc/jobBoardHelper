import { Module } from '@nestjs/common';
import { DubizzleService } from './dubizzle.service';
import { DubizzleController } from './dubizzle.controller';

@Module({
  controllers: [DubizzleController],
  providers: [DubizzleService],
})
export class DubizzleModule {}
