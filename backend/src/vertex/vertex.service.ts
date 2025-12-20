import { Inject, Injectable } from '@nestjs/common';
import { VertexRepository } from './repositories/vertex-repo.repository';

@Injectable()
export class VertexService {
  constructor(@Inject() private repo: VertexRepository) {}
}
