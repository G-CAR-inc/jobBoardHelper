import { Test, TestingModule } from '@nestjs/testing';
import { HyperSdkService } from './hyper-sdk.service';
import { ConfigModule, ConfigService } from '@nestjs/config'; // <-- 1. Import ConfigModule
import { Session } from 'hyper-sdk-js';
import { Logger } from '@nestjs/common';

// Mock the Session, but let ConfigModule provide the real ConfigService
const mockSession = {};

describe('HyperSdkService', () => {
  let service: HyperSdkService;
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      // 2. Import ConfigModule.forRoot() here
      imports: [ConfigModule.forRoot()],
      providers: [
        HyperSdkService,
        {
          provide: Session,
          useValue: mockSession,
        },
        // 3. Remove the mock ConfigService provider
        //    Nest will now use the real one from ConfigModule
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<HyperSdkService>(HyperSdkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log the api key on module init', async () => {
    service.onModuleInit();

    // You can optionally add a test to be 100% sure
    const config = module.get<ConfigService>(ConfigService);
    expect(config.get('HYPER_SDK_API_KEY')).toBeTruthy();
  });

  it('???', async () => {});
});
