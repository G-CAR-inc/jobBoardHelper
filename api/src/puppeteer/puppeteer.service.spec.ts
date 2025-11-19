import { Test, TestingModule } from '@nestjs/testing';
import { PuppeteerService } from './puppeteer.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

// We are NOT mocking puppeteer or stealth plugin.
// This test will launch the REAL browser.

describe('PuppeteerService (Integration)', () => {
  let service: PuppeteerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuppeteerService,
        {
          provide: ConfigService,
          useValue: {
            // Providing real-world like config for the integration test
            get: jest.fn((key: string) => {
              if (key === 'URL_TO_PARSE') return 'https://jobs.dubizzle.com'; // Use a stable, reliable site for testing
              if (key === 'USER_AGENT')
                return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
              return null;
            }),
          },
        },
      ],
    })
      .setLogger(new Logger('PUPPETER TEST LOGGER'))
      .compile();

    service = module.get<PuppeteerService>(PuppeteerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully launch Chrome, navigate to a page, and retrieve data', async () => {
    // Initialize the service (registers stealth plugin)
    service.onModuleInit();

    console.log('🚀 Starting Puppeteer Integration Test...');

    // Increase timeout because launching real chrome takes time
    const result = await service.runBotFlow();

    console.log('✅ Browser closed. validating results...');

    // 1. Validate Cookies
    expect(result.cookies).toBeDefined();
    expect(Array.isArray(result.cookies)).toBe(true);
    // Google always sets cookies, so this should be > 0
    expect(result.cookies.length).toBeGreaterThan(0);

    // 2. Validate HTML Content
    expect(result.html).toBeDefined();
    expect(typeof result.html).toBe('string');
    expect(result.html).toContain('<!DOCTYPE html>'); // Standard HTML doctype
    expect(result.html.length).toBeGreaterThan(100); // Should be a substantial string

    // 3. Validate Local Storage
    expect(result.localStorage).toBeDefined();
    // Note: LocalStorage might be empty on a fresh incognito session for Google,
    // but the object itself should exist.
    expect(typeof result.localStorage).toBe('object');
  }, 60000); // 60 seconds timeout for real browser interaction
});
