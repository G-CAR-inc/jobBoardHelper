import { Test, TestingModule } from '@nestjs/testing';
import { HyperSdkService } from './hyper-sdk.service';
import { ConfigService } from '@nestjs/config';
import { Session } from 'hyper-sdk-js';

// 1. Create mocks for the dependencies
const mockSession = {};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'HYPER_SDK_API_KEY') {
      return;
    }
    return null;
  }),
};

describe('HyperSdkService', () => {
  let service: HyperSdkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HyperSdkService,
        // 2. Provide the mocks
        {
          provide: Session,
          useValue: mockSession,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<HyperSdkService>(HyperSdkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log the api key on module init', async () => {
    // 3. Call the lifecycle hook explicitly to trigger the log
    await service.onModuleInit();

    // Check that the log was called
    // (This test just checks that the config was read)
    expect(mockConfigService.get).toHaveBeenCalledWith('HYPER_SDK_API_KEY');
  });
});
