import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCookieDto, CreateReese84Dto, CreateSessionDto, CreateUtmvcDto } from '../types';

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
  saveSession(dto: CreateSessionDto) {
    return this.prisma.session.create({
      data: {
        publicIp: dto.publicIp,
        domain: dto.domain,
        userAgent: dto.userAgent,
        acceptLanguage: dto.acceptLanguage,
        accept: dto.accept,
        sdkUsage: dto.sdkUsage,
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
  saveCookiesBulk(sessionId: number, dtos: CreateCookieDto[]) {
    // Prisma createMany is more efficient for arrays
    return this.prisma.cookie.createMany({
      data: dtos.map((dto) => ({
        key: dto.key,
        value: dto.value,
        domain: dto.domain,
        path: dto.path ?? '/',
        maxAge: dto.maxAge,
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
