import { Test, TestingModule } from '@nestjs/testing';
import { BypassService } from './bypass.service';

describe('BypassService', () => {
  let service: BypassService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BypassService],
    }).compile();

    service = module.get<BypassService>(BypassService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
