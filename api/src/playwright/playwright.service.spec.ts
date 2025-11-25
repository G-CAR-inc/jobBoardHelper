import { Test, TestingModule } from '@nestjs/testing';
import { PlaywrightService } from './playwright.service';
import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

describe('PlaywrightService', () => {
  let service: PlaywrightService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), PrismaModule],
      providers: [PlaywrightService],
    })
      .setLogger(new Logger())
      .compile();
    service = module.get<PlaywrightService>(PlaywrightService);
    await module.init();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should log ip', async () => {
    await service.authFlow();
  }, 15000);
});
