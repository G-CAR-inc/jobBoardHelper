import { Test, TestingModule } from '@nestjs/testing';
import { HyperSdkService } from './hyper-sdk.service';
import { ConfigService } from '@nestjs/config';
import { Session } from 'hyper-sdk-js';

// Create a mock Session class or object
const mockSession = {
  // Add mock methods that your service might call
  // example: mockMethod: () => 'mocked value'
};

// Create a mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'HYPER_SDK_API_KEY') {
      return 'your-test-api-key';
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
        {
          provide: Session,
          useValue: mockSession, // Provide the mock session
        },
        {
          provide: ConfigService,
          useValue: mockConfigService, // Provide the mock config
        },
      ],
    }).compile();

    service = module.get<HyperSdkService>(HyperSdkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add other tests here to validate your onModuleInit logic
  it('should log the api key on init', async () => {
    await service.onModuleInit();
    // You can spy on the logger to ensure it was called with the key
    // (Requires more advanced mock setup for the Logger)
    expect(mockConfigService.get).toHaveBeenCalledWith('HYPER_SDK_API_KEY');
  });
});