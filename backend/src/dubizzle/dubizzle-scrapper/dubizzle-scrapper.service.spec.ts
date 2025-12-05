import { Test, TestingModule } from '@nestjs/testing';
import { DubizzleScrapperService } from './dubizzle-scrapper.service';
import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DubizzleService } from '../dubizzle.service';
import { DubizzleModule } from '../dubizzle.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { BypassRepository } from '../repositories/bypass.repository';

describe('DubizzleScrapperService', () => {
  let service: DubizzleScrapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), HttpModule.register({}), PrismaModule, DubizzleModule],
      providers: [DubizzleScrapperService,BypassRepository,DubizzleService],
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
