import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PuppeteerService implements OnModuleInit {
  private readonly logger = new Logger(PuppeteerService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    puppeteer.use(StealthPlugin());
    this.logger.log('Puppeteer Stealth Plugin initialized');
  }

  /**
   * Executes the main scraping flow:
   * 1. Launches Google Chrome
   * 2. Navigates to the target URL
   * 3. Extracts Cookies, LocalStorage, and SessionStorage
   * 4. Saves them to separate JSON files
   */
  async runBotFlow() {
    // const url = this.configService.get<string>('URL_TO_PARSE') || 'https://jobs.dubizzle.com/';

    const url =
      'https://dubai.dubizzle.com/en/user/auth/email/33c1cb7f8bed4107bc43e2d7e6d3d81f/?utm_campaign=magic-link&utm_medium=email&utm_source=transactional';
    const userAgent = this.configService.get<string>('USER_AGENT');

    // Default to standard Linux Chrome path if env var not set
    const executablePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';

    let browser: Browser | null = null;

    try {
      this.logger.log(`Launching Chrome from: ${executablePath}`);

      browser = await puppeteer.launch({
        headless: false, // Visible for debugging
        executablePath: executablePath,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080'],
      });

      const page = await browser.newPage();

      if (userAgent) {
        await page.setUserAgent(userAgent);
      }

      this.logger.log(`Navigating to ${url}...`);

      // Wait for network to be idle to ensure all storage items are set

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      setTimeout(async () => {
        // --- 1. Extract Cookies ---
        const cookies = await page.cookies();
        this.logger.debug(`Captured ${cookies.length} cookies`);

        // --- 2. Extract Local Storage & Session Storage ---
        // We use page.evaluate to run code inside the browser context
        const storageData = await page.evaluate(() => {
          const jsonLocalStorage: Record<string, string> = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) jsonLocalStorage[key] = localStorage.getItem(key) || '';
          }

          const jsonSessionStorage: Record<string, string> = {};
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key) jsonSessionStorage[key] = sessionStorage.getItem(key) || '';
          }

          return {
            localStorage: jsonLocalStorage,
            sessionStorage: jsonSessionStorage,
          };
        });

        // --- 3. Save to Files ---
        await this.saveDataToFiles({
          cookies,
          localStorage: storageData.localStorage,
          sessionStorage: storageData.sessionStorage,
        });

        this.logger.log('✅ Navigation and Extraction Successful');

        return {
          cookies,
          localStorage: storageData.localStorage,
          sessionStorage: storageData.sessionStorage,
          html: await page.content(),
        };
      }, 10000);
    } catch (error) {
      this.logger.error('❌ Error during Puppeteer flow', error);
      throw error;
    } finally {
      if (browser) {
        // await browser.close();
        this.logger.log('Browser closed');
      }
    }
  }

  private async saveDataToFiles(data: { cookies: any[]; localStorage: Record<string, string>; sessionStorage: Record<string, string> }) {
    const dataDir = path.join(process.cwd(), 'data');

    // Ensure directory exists
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // 1. Save Cookies
    await fs.writeFile(path.join(dataDir, `cookies-${timestamp}.json`), JSON.stringify(data.cookies, null, 2));

    // 2. Save Local Storage
    await fs.writeFile(path.join(dataDir, `local-storage-${timestamp}.json`), JSON.stringify(data.localStorage, null, 2));

    // 3. Save Session Storage
    await fs.writeFile(path.join(dataDir, `session-storage-${timestamp}.json`), JSON.stringify(data.sessionStorage, null, 2));

    this.logger.log(`💾 Session data saved to ${dataDir}`);
  }
}
