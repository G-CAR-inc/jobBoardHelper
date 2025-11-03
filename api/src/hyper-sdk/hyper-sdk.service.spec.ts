import { Test, TestingModule } from '@nestjs/testing';
import { HyperSdkService } from './hyper-sdk.service';

describe('HyperSdkService', () => {
  let service: HyperSdkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HyperSdkService],
    }).compile();

    service = module.get<HyperSdkService>(HyperSdkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
