import { Test, TestingModule } from '@nestjs/testing';
import { DubizzleService } from './dubizzle.service';
import { Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { BrowserSessionRepository } from './repositories/browser-session.repository';
import { PrismaModule } from '../prisma/prisma.module';
describe('DubizzleService', () => {
  let service: DubizzleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          // envFilePath: '.env.test',
        }),
        HttpModule.register({
          baseURL: 'https://jobs.dubizzle.com',
          timeout: 5000,
          maxRedirects: 5,
        }),
        PrismaModule
      ],
      providers: [DubizzleService, BrowserSessionRepository],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<DubizzleService>(DubizzleService);
    await module.init();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should return Incapsula resource', async () => {
    const incapsulaJs = await service.scrap();
  });
});
//
