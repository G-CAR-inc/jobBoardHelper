import { Test, TestingModule } from '@nestjs/testing';
import { DubizzleScrapperService } from './dubizzle-scrapper.service';
import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DubizzleModule } from '../dubizzle.module';
import { PrismaModule } from '../../prisma/prisma.module';

describe('DubizzleScrapperService', () => {
  let service: DubizzleScrapperService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        // Loads .env variables globally so DubizzleService can access them
        ConfigModule.forRoot({ isGlobal: true }),
        // Required for database sessions used by the scraper
        PrismaModule,
        // Provides the fully configured DubizzleService
        DubizzleModule,
      ],
      providers: [
        // The service we are actually testing
        DubizzleScrapperService,
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<DubizzleScrapperService>(DubizzleScrapperService);

    // Initialize the module to connect to the DB and set up the scraper state
    await module.init();
  });

  afterEach(async () => {
    // Clean up connections after the test
    await module.close();
  });

  // Increased timeout to 60 seconds (60000ms) for real network requests
  it('should run the scraping process', async () => {
    try {
      const result = await service.scrape();
      Logger.log('Scraping completed successfully', result);
      // expect(result).toBeDefined(); // Or specific assertions if scrap returns data
    } catch (error) {
      Logger.error('Scraping failed', error);
      throw error;
    }
  }, 60000);
});
