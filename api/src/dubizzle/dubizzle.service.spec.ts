import { Test, TestingModule } from '@nestjs/testing';
import { DubizzleService } from './dubizzle.service';
import { Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
// 1. Import the Service class (as a token), not the Module
import { HyperSdkService } from '../hyper-sdk/hyper-sdk.service';
import { ConfigModule } from '@nestjs/config';
import { HyperSdkModule } from '../hyper-sdk/hyper-sdk.module';

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
        HyperSdkModule,
      ],
      providers: [DubizzleService],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<DubizzleService>(DubizzleService);
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
