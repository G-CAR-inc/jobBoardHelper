import { Test, TestingModule } from '@nestjs/testing';
import { PlaywrightController } from './playwright.controller';

describe('PlaywrightController', () => {
  let controller: PlaywrightController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaywrightController],
    }).compile();

    controller = module.get<PlaywrightController>(PlaywrightController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
