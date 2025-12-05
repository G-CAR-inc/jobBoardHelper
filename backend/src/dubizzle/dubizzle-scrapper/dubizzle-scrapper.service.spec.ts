import { Test, TestingModule } from '@nestjs/testing';
import { DubizzleScrapperService } from './dubizzle-scrapper.service';
import { DubizzleModule } from '../dubizzle.module';
import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../prisma/prisma.module';
import { DubizzleService } from '../dubizzle.service';

describe('DubizzleScrapperService', () => {
  let service: DubizzleScrapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DubizzleModule,
        ConfigModule.forRoot({
          isGlobal: true,
          // envFilePath: '.env.test',
        }),
        HttpModule.register({
          baseURL: 'https://jobs.dubizzle.com',
          timeout: 5000,
          maxRedirects: 5,
        }),
        PrismaModule,
      ],
      providers: [DubizzleScrapperService],
    })
      .setLogger(new Logger())
      .compile();
    module.init();
    service = module.get<DubizzleScrapperService>(DubizzleScrapperService);
  });

  it('should be defined', () => {
    service.scrap();
  });
});
