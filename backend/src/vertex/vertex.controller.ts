import { Controller } from '@nestjs/common';
import { VertexService } from './vertex.service';

@Controller('vertex')
export class VertexController {
  constructor(private readonly vertexService: VertexService) {}
}
