import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DubizzleModule } from './dubizzle/dubizzle.module';

@Module({
  imports: [DubizzleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
