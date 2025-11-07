import { Test, TestingModule } from '@nestjs/testing';
import { DubizzleController } from './dubizzle.controller';
import { DubizzleService } from './dubizzle.service';

describe('DubizzleController', () => {
  let controller: DubizzleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DubizzleController],
      providers: [DubizzleService],
    }).compile();

    controller = module.get<DubizzleController>(DubizzleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
