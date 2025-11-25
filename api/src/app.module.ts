import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DubizzleModule } from './dubizzle/dubizzle.module';
import { ConfigModule } from '@nestjs/config';
import { PuppeteerModule } from './puppeteer/puppeteer.module';
import { PrismaModule } from './prisma/prisma.module';
import { PlaywrightModule } from './playwright/playwright.module';

@Module({
  imports: [DubizzleModule, ConfigModule.forRoot({ isGlobal: true }), PuppeteerModule, PrismaModule, PlaywrightModule],
})
export class AppModule {}
