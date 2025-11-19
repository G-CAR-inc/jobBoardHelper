import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { HbConfigService } from '@nestjs/config'; // Assuming you might want typed config, otherwise standard ConfigService
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';

@Injectable()
export class PuppeteerService implements OnModuleInit {
  private readonly logger = new Logger(PuppeteerService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // 1. Enable the Stealth Plugin to hide automation traces
    puppeteer.use(StealthPlugin());
    this.logger.log('Puppeteer Stealth Plugin initialized');
  }

  /**
   * Executes the main scraping flow:
   * 1. Launches Google Chrome (channel='chrome' equivalent)
   * 2. Configures User Agent & Viewport
   * 3. Navigates to the target Dubizzle URL
   * 4. Extracts Cookies & LocalStorage (useful for session saving)
   */
  async runBotFlow() {
    const url = this.configService.get<string>('URL_TO_PARSE') || 'https://jobs.dubizzle.com/';
    const userAgent = this.configService.get<string>('USER_AGENT');

    // ⚠️ CRITICAL: On Ubuntu 24, point this to your installed Chrome binary.
    // Run `which google-chrome` in terminal to verify this path.
    const executablePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';

    let browser: Browser | null = null;

    try {
      this.logger.log(`Launching Chrome from: ${executablePath}`);

      browser = await puppeteer.launch({
        headless: false, // Keep false for debugging bot challenges
        executablePath: executablePath, // Uses real Chrome instead of bundled Chromium
        defaultViewport: null, // Allows the window to resize naturally
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Helps with memory in Docker/Linux
          '--window-size=1920,1080',
        ],
      });

      const page = await browser.newPage();

      // 2. Configure the Browser Context
      if (userAgent) {
        await page.setUserAgent(userAgent);
      }

      // Optional: Add extra headers if needed for the specific bot protection
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
      });

      this.logger.log(`Navigating to ${url}...`);

      // 3. Navigate to the target
      // waitUntil: 'networkidle2' waits until there are no more than 2 network connections for at least 500 ms.
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      // 4. Wait for any specific selector if needed (e.g., verifying site loaded)
      // await page.waitForSelector('body');

      // 5. Extract Data (Cookies & Local Storage)
      // This mimics the functionality you asked about in previous prompts
      const cookies = await page.cookies();

      const localStorageData = await page.evaluate(() => {
        const data: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) data[key] = localStorage.getItem(key) || '';
        }
        return data;
      });

      this.logger.log('✅ Navigation Successful');
      this.logger.debug(`Captured ${cookies.length} cookies`);

      // Example: Check for specific security cookies (like reese84)
      const reese84 = cookies.find((c) => c.name === 'reese84');
      if (reese84) {
        this.logger.log(`Found reese84 cookie: ${reese84.value.substring(0, 15)}...`);
      }

      // Return the session data so you can use it in your HttpService (Axios) later if needed
      return {
        cookies,
        localStorage: localStorageData,
        html: await page.content(),
      };
    } catch (error) {
      this.logger.error('❌ Error during Puppeteer flow', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
        this.logger.log('Browser closed');
      }
    }
  }
}
