import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BypassRepository {
  constructor(private readonly prisma: PrismaService) {}
  findLatestSession(domain: string) {
    return this.prisma.reese84Token.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  }
  
}
