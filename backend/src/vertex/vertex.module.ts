import { Module } from '@nestjs/common';
import { VertexService } from './vertex.service';
import { VertexController } from './vertex.controller';
import { VertexRepository } from './repositories/vertex-repo.repository';
import { SchedulerService } from './scheduler/vertex-scheduler.service';

@Module({
  controllers: [VertexController],
  providers: [VertexService, VertexRepository, SchedulerService],
})
export class VertexModule {}
