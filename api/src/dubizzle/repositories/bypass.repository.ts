
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCookieDto, CreateReese84Dto, CreateSessionDto, CreateUtmvcDto } from '../types';
import { Session } from '@prisma/client';
import { Cookie } from 'tough-cookie';

@Injectable()
export class BypassRepository {
  constructor(private readonly prisma: PrismaService) {}
  // ==========================================
  // SESSION UTILITIES
  // ==========================================

  /**
   * Creates a new browsing session.
   * Returns the created session object (including ID).
   */
  saveSession(dto: Omit<Session, 'id' | 'createdAt'>) {
    return this.prisma.session.create({
      data: {
        publicIp: dto.publicIp,
        sdkUsage: dto.sdkUsage,
        refreshToken: dto.refreshToken,
        accessToken: dto.accessToken,
      },
    });
  }

  /**
   * Retrieves a session by ID including all relations.
   */
  getSessionById(sessionId: number) {
    return this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        cookies: true,
      },
    });
  }
  getLatestSession() {
    return this.prisma.session.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        cookies: true,
      },
    });
  }

  /**
   * Saves a single cookie.
   */
  saveCookie(sessionId: number, dto: CreateCookieDto) {
    return this.prisma.cookie.create({
      data: {
        key: dto.key,
        value: dto.value,
        domain: dto.domain,
        path: dto.path ?? '/',
        maxAge: dto.maxAge,
        secure: dto.secure ?? true,
        httpOnly: dto.httpOnly ?? true,
        sessionId: sessionId,
      },
    });
  }

  /**
   * Bulk saves multiple cookies for a session.
   * Useful when parsing a `set-cookie` array header.
   */
  saveCookiesBulk(sessionId: number, dtos: Cookie[]) {
    // Prisma createMany is more efficient for arrays
    return this.prisma.cookie.createMany({
      data: dtos.map((dto) => ({
        key: dto.key!,
        value: dto.value!,
        domain: dto.domain!,
        path: dto.path ?? '/',
        maxAge: typeof dto.maxAge === 'number' ? Math.floor(dto.maxAge) : null,
        secure: dto.secure ?? true,
        httpOnly: dto.httpOnly ?? true,
        sessionId: sessionId,
      })),
    });
  }

  /**
   * Get all cookies for a specific session formatted as an array.
   */
  getCookiesForSession(sessionId: number) {
    return this.prisma.cookie.findMany({
      where: { sessionId },
    });
  }
}
