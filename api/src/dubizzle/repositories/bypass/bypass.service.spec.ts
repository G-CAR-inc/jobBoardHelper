import { Test, TestingModule } from '@nestjs/testing';
import { BypassRepository } from '../bypass.repository';

describe('BypassService', () => {
  let service: BypassRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BypassRepository],
    }).compile();

    service = module.get<BypassRepository>(BypassRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
