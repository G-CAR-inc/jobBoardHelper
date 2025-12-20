import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VertexRepository {
  constructor(@Inject() private prisma: PrismaService) {}
}
