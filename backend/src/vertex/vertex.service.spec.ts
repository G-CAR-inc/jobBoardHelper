import { Test, TestingModule } from '@nestjs/testing';
import { VertexService } from './vertex.service';

describe('VertexService', () => {
  let service: VertexService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VertexService],
    }).compile();

    service = module.get<VertexService>(VertexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
