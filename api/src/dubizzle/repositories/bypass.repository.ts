import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { reese84Token, SessionDto } from '../types';

@Injectable()
export class BypassRepository {
  constructor(private readonly prisma: PrismaService) {}
  findLatestReese84(domain: string) {
    return this.prisma.reese84Token.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  }
  saveReese84(props: { dto: reese84Token; timestmp: Date; sessionId: string }) {
    const { dto, timestmp, sessionId } = props;
    return this.prisma.reese84Token.create({
      data: {
        domain: dto.cookieDomain,
        token: dto.token,
        renewInSec: dto.renewInSec,
        createdAt: timestmp,
        sessionId,
      },
    });
  }
  registerSession(sessiondDto: SessionDto) {
    const { ip, userAgent, accept, acceptLanguage, domain } = sessiondDto;
    return this.prisma.session.create({ data: { publicIp: ip, userAgent, accept, acceptLanguage, domain } });
  }
}
