import { chromium } from 'playwright';
import { Session } from 'hyper-sdk-js';
import { AkamaiHandler, DataDomeHandler, IncapsulaHandler, KasadaHandler } from 'hyper-sdk-playwright';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { getPublicIp } from '../utils/shared/srared.utils';

@Injectable()
export class PlaywrightService implements OnModuleInit {
  private readonly logger = new Logger(PlaywrightService.name);
  private hyperSolutionsApiKey: string;
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}
  onModuleInit() {
    this.hyperSolutionsApiKey = this.config.getOrThrow<string>('HYPER_SDK_API_KEY');
  }

  async flow() {
    this.logger.log(`hyper solution api key: ${this.hyperSolutionsApiKey}`)
    // const session = new Session(this.hyperSolutionsApiKey);

    // Launch browser with proxy (recommended)
    const browser = await chromium.launch({
      channel: 'chrome',
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();
    const { ip } = await getPublicIp();
    this.logger.log({ ip });
    // const incapsulaHandler = new IncapsulaHandler({
    //   session,
    //   ipAddress: ip,
    //   acceptLanguage: 'en-US,en;q=0.9',
    // });

    // await Promise.all([incapsulaHandler.initialize(page, context)]);

    // Navigate to target site

    this.logger.log('Navigating to example.com...');
    await page.goto('https://google.com');
    await new Promise((res, rej) => setTimeout(res, 5000));
    await browser.close();
  }
}
