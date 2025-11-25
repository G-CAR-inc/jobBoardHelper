import { chromium } from 'playwright';
import { Session } from 'hyper-sdk-js';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { getPublicIp } from '../utils/shared/srared.utils';

import { IncapsulaHandler } from 'hyper-sdk-playwright';

@Injectable()
export class PlaywrightService implements OnModuleInit {
  private readonly logger = new Logger(PlaywrightService.name);
  private hyperSolutionsApiKey: string;
  private legitRefferer: string;
  private userAgent: string;
  private initMagicLink: string;
  // Credentials
  private email: string;
  private password: string;
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}
  onModuleInit() {
    this.hyperSolutionsApiKey = this.config.getOrThrow<string>('HYPER_SDK_API_KEY');
    this.legitRefferer = this.config.getOrThrow<string>('LEGIT_REFERRER');
    this.initMagicLink = this.config.getOrThrow<string>('INIT_MAGIC_LINK');
    this.userAgent = this.config.getOrThrow<string>('USER_AGENT');
    this.email = this.config.get<string>('DUBIZZLE_EMAIL') || '';
    this.password = this.config.get<string>('DUBIZZLE_PASSWORD') || '';
  }
  async authFlow() {
    this.logger.log(`Starting Auth Flow with Email: ${this.email}`);

    const session = new Session(this.hyperSolutionsApiKey);

    // Launch browser with proxy (recommended)
    const browser = await chromium.launch({
      channel: 'chrome',
      headless: false,
    });

    try {
      const context = await browser.newContext({
        userAgent: this.userAgent,
      });

      const page = await context.newPage();

      const { ip } = await getPublicIp();
      this.logger.log({ ip });

      const incapsulaHandler = new IncapsulaHandler({
        session,
        ipAddress: ip,
        acceptLanguage: 'en-US,en;q=0.9',
      });

      await Promise.all([incapsulaHandler.initialize(page, context)]);

      // Optional: Log IP for debugging
      // const { ip } = await getPublicIp();
      // this.logger.log({ ip });

      // 1. GOTO https://uae.dubizzle.com/user/auth/
      this.logger.log('Navigating to auth page...');
      await page.goto('https://uae.dubizzle.com/user/auth/', { waitUntil: 'domcontentloaded' });
      await new Promise((res, rej) => setTimeout(res, 5000));
      return;
      // 2. click "Continue with Email"
      this.logger.log('Clicking "Continue with Email"...');
      await page.getByText('Continue with Email').click();

      await new Promise((res, rej) => setTimeout(res, 5000));
      // 3. find input with 'Email' placeholder & insert email
      this.logger.log('Entering email...');
      await page.getByPlaceholder('Email').fill(this.email);

      await new Promise((res, rej) => setTimeout(res, 5000));
      // 4. find input with 'Password' placeholder & insert password
      this.logger.log('Entering password...');
      await page.getByPlaceholder('Password').fill(this.password);

      await new Promise((res, rej) => setTimeout(res, 5000));
      // 5. click submit button
      this.logger.log('Submitting credentials...');
      await page.locator('button[type="submit"]').click();

      await new Promise((res, rej) => setTimeout(res, 5000));
      // Wait for transition to verification screen
      await page.waitForLoadState('networkidle');

      await new Promise((res, rej) => setTimeout(res, 5000));
      // 6. choose "Verify with Email" button
      this.logger.log('Selecting "Verify with Email"...');

      await new Promise((res, rej) => setTimeout(res, 5000));
      // Assuming this selects a radio option or clicks a button
      await page.getByText('Verify with Email').click();

      await new Promise((res, rej) => setTimeout(res, 5000));
      // 7. click submit button
      this.logger.log('Confirming verification method...');
      // Check if the previous click already submitted the form or if explicit submit is needed
      if (await page.locator('button[type="submit"]').isVisible()) {
        await page.locator('button[type="submit"]').click();
      }

      await new Promise((res, rej) => setTimeout(res, 5000));
      this.logger.log('Flow complete. Waiting 5s before closing...');
      await page.waitForTimeout(5000);
    } catch (error) {
      this.logger.error('Error executing authFlow', error);
    } finally {
      //   await browser.close();
    }
  }
  async flow() {
    this.logger.log(`hyper solution api key: ${this.hyperSolutionsApiKey}`);
    this.authFlow();
  }
}
