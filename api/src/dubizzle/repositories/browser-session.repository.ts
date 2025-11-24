import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BrowserSessionRepository {
  constructor(private readonly prisma: PrismaService) {}
  findLatestSession(domain: string) {
    return this.prisma.browserSession.findFirst({
      where: { domain },
      orderBy: { createdAt: 'desc' },
    });
  }
}
