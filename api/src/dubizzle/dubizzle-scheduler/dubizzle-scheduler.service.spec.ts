import { Test, TestingModule } from '@nestjs/testing';
import { DubizzleSchedulerService } from './dubizzle-scheduler.service';

describe('DubizzleSchedulerService', () => {
  let service: DubizzleSchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DubizzleSchedulerService],
    }).compile();

    service = module.get<DubizzleSchedulerService>(DubizzleSchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
