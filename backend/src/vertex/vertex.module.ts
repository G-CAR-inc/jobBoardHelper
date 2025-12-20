import { Module } from '@nestjs/common';
import { VertexService } from './vertex.service';
import { VertexController } from './vertex.controller';
import { VertexRepository } from './repositories/vertex-repo.repository';

@Module({
  controllers: [VertexController],
  providers: [VertexService, VertexRepository],
})
export class VertexModule {}
