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
  async registerSession(dto: CreateSessionDto) {
    return this.prisma.session.create({
      data: {
        publicIp: dto.publicIp,
        domain: dto.domain,
        userAgent: dto.userAgent,
        acceptLanguage: dto.acceptLanguage,
        accept: dto.accept,
        // createdAt is handled automatically by @default(now()) in Schema
      },
    });
  }

  /**
   * Retrieves a session by ID including all relations.
   */
  async getSessionById(sessionId: string) {
    return this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        utmvcTokens: true,
        reese84Tokens: true,
        cookies: true,
      },
    });
  }

  // ==========================================
  // REESE84 UTILITIES
  // ==========================================

  /**
   * Saves a Reese84 token linked to a specific session.
   */
  async saveReese84(sessionId: string, dto: CreateReese84Dto) {
    return this.prisma.reese84Token.create({
      data: {
        token: dto.token,
        renewInSec: dto.renewInSec,
        domain: dto.domain,
        createdAt: dto.createdAt, // Manual timestamp
        sessionId: sessionId,
      },
    });
  }

  /**
   * Finds the latest Reese84 token for a specific domain.
   */
  async findLatestReese84(domain: string) {
    return this.prisma.reese84Token.findFirst({
      where: { domain },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==========================================
  // UTMVC UTILITIES
  // ==========================================

  /**
   * Saves a UTMVC token linked to a specific session.
   */
  async saveUtmvc(sessionId: string, dto: CreateUtmvcDto) {
    return this.prisma.utmvcToken.create({
      data: {
        token: dto.token,
        createdAt: dto.createdAt, // Manual timestamp
        sessionId: sessionId,
      },
    });
  }

  /**
   * Finds the latest UTMVC token for a specific session.
   */
  async findLatestUtmvc(sessionId: string) {
    return this.prisma.utmvcToken.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==========================================
  // COOKIE UTILITIES
  // ==========================================

  /**
   * Saves a single cookie.
   */
  async saveCookie(sessionId: string, dto: CreateCookieDto) {
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
  async saveCookiesBulk(sessionId: string, dtos: CreateCookieDto[]) {
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
  async getCookiesForSession(sessionId: string) {
    return this.prisma.cookie.findMany({
      where: { sessionId },
    });
  }
}
