import { Test, TestingModule } from '@nestjs/testing';
import { VertexController } from './vertex.controller';
import { VertexService } from './vertex.service';

describe('VertexController', () => {
  let controller: VertexController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VertexController],
      providers: [VertexService],
    }).compile();

    controller = module.get<VertexController>(VertexController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
