import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page, CookieParam } from 'puppeteer';
import { PrismaService } from '../prisma/prisma.service';
import { URL } from 'url';

@Injectable()
export class PuppeteerService implements OnModuleInit {
  private readonly logger = new Logger(PuppeteerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    puppeteer.use(StealthPlugin());
    this.logger.log('Puppeteer Stealth Plugin initialized');
  }

  async refreshTokens() {
    const legitRefferer = this.configService.getOrThrow<string>('LEGIT_REFERRER');
    const domain = new URL(legitRefferer).hostname;

    const initMagicLink = this.configService.get<string>('INIT_MAGIC_LINK');
    const userAgent = this.configService.get<string>('USER_AGENT');
    const executablePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';

    let browser: Browser | null = null;

    try {
      // 1) Check if the db table has any records.
      const existingSession = await this.prisma.browserSession.findFirst({
        where: { domain },
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(`Launching Browser for ${domain}...`);

      browser = await puppeteer.launch({
        headless: false,
        executablePath,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080', ...(userAgent ? [`--user-agent=${userAgent}`] : [])],
      });

      const page = await browser.newPage();

      if (!existingSession) {
        // 2.1) Init via Magic Link
        if (!initMagicLink) {
          throw new Error('No session found and INIT_MAGIC_LINK is missing');
        }
        this.logger.log('No existing session. Initializing via Magic Link...');
        await page.goto(initMagicLink, { waitUntil: 'networkidle2', timeout: 60000 });
      } else {
        // 2.2) Restore existing session
        this.logger.log('Found existing session. Restoring state...');

        if (existingSession.cookies) {
          const rawCookies = existingSession.cookies as unknown as CookieParam[];

          const cookiesToRestore = rawCookies.map((c) => ({
            ...c,
            domain: c.domain || domain,
          }));

          await page.browserContext().setCookie(...(cookiesToRestore as any[]));
        }

        this.logger.log(`Navigating to ${legitRefferer} to inject storage...`);
        await page.goto(legitRefferer, { waitUntil: 'domcontentloaded' });

        await page.evaluate(
          (ls, ss) => {
            if (ls) {
              Object.entries(ls).forEach(([k, v]) => localStorage.setItem(k, v as string));
            }
            if (ss) {
              Object.entries(ss).forEach(([k, v]) => sessionStorage.setItem(k, v as string));
            }
          },
          existingSession.localStorage || {},
          existingSession.sessionStorage || {},
        );

        this.logger.log('Reloading page to apply storage state...');
        await page.reload({ waitUntil: 'networkidle2' });
      }

      // 3) Navigate to target
      if (page.url() !== legitRefferer) {
        this.logger.log(`Navigating to target: ${legitRefferer}`);
        await page.goto(legitRefferer, { waitUntil: 'networkidle2' });
      }

      // --- WAIT LOGIC ---
      // Instead of setTimeout callback, we await a promise that resolves after 10s
      this.logger.log('Waiting 10s for page to settle...');
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // --- EXTRACT LOGIC ---
      this.logger.log('Extracting new session state...');

      const cookies = await page.browserContext().cookies();

      const storageData = await page.evaluate(() => {
        const ls: Record<string, string> = {};
        const ss: Record<string, string> = {};

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) ls[key] = localStorage.getItem(key) || '';
        }
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) ss[key] = sessionStorage.getItem(key) || '';
        }
        return { ls, ss };
      });

      this.logger.log('Saving state to database...');
      this.logger.log({
        message: 'successfully fetched tokens :)',
        access_token: storageData.ls['access_token'],
        refresh_token: storageData.ls['refresh_token'],
        reese84: storageData.ls['reese84'],
      });

      const savedSession = await this.prisma.browserSession.create({
        data: {
          domain,
          cookies: cookies as any,
          localStorage: storageData.ls,
          sessionStorage: storageData.ss,
        },
      });

      // 4) Close Browser
      await browser.close();
      this.logger.log('Browser closed.');

      // 5) Return Data (Now this line is reachable and contains the data)
      return savedSession;
    } catch (error) {
      this.logger.error('❌ Error during refreshTokens flow', error);
      if (browser) await browser.close();
      throw error;
    }
  }
}
