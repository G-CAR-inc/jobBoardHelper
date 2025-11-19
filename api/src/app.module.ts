import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DubizzleModule } from './dubizzle/dubizzle.module';
import { ConfigModule } from '@nestjs/config';
import { HyperSdkModule } from './hyper-sdk/hyper-sdk.module';
import { PuppeteerModule } from './puppeteer/puppeteer.module';

@Module({
  imports: [DubizzleModule, ConfigModule.forRoot({ isGlobal: true }), HyperSdkModule, PuppeteerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
