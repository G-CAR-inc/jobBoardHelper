import { Test, TestingModule } from '@nestjs/testing';
import { PuppeteerService } from './puppeteer.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaModule } from '../prisma/prisma.module';
import { Logger } from '@nestjs/common';

describe('PuppeteerService (Integration)', () => {
  let service: PuppeteerService;

  // Explicitly register the stealth plugin for the test environment
  puppeteer.use(StealthPlugin());

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ConfigModule.forRoot({ isGlobal: true })],
      providers: [PuppeteerService],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<PuppeteerService>(PuppeteerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should be defined', async () => {
    await service.refreshTokens();
  },15000);
  // it('should successfully launch Chrome with Stealth Plugin, navigate to a page, and retrieve data', async () => {
  //   // Initialize the service
  //   service.onModuleInit();

  //   console.log('🚀 Starting Puppeteer Integration Test (Stealth Mode)...');

  //   // Increase timeout because launching real chrome takes time
  //   let result: any;
  //   try {
  //     result = await service.refreshTokens();
  //   } catch (e) {
  //     Logger.error(e);
  //   }

  //   console.log('✅ Browser closed. validating results...');

  //   // 1. Validate Cookies
  //   expect(result.cookies).toBeDefined();
  //   expect(Array.isArray(result.cookies)).toBe(true);

  //   expect(result.localStorage).toBeDefined();
  //   expect(typeof result.localStorage).toBe('object');
  // }, 60000); // 60 seconds timeout for real browser interaction
});
