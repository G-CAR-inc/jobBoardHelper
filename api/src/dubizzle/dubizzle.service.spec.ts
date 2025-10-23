import { Test, TestingModule } from '@nestjs/testing';
import { DubizzleService } from './dubizzle.service';

describe('DubizzleService', () => {
  let service: DubizzleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DubizzleService],
    }).compile();

    service = module.get<DubizzleService>(DubizzleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
