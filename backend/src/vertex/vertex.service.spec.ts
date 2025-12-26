import { Test, TestingModule } from '@nestjs/testing';
import { VertexService } from './vertex.service';
import { PrismaModule } from '../prisma/prisma.module';
import { Logger } from '@nestjs/common';
import { VertexRepository } from './repositories/vertex-repo.repository';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

describe('VertexService', () => {
  let service: VertexService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ConfigModule.forRoot(), HttpModule],
      providers: [VertexService, VertexRepository],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<VertexService>(VertexService);
  });

  it('should be defined', async () => {
    await service.analyze();
  });
});
