// src/dubizzle/guards/api-key.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];
    // Ensure you add API_KEY to your .env file
    const validApiKey = this.configService.get<string>('API_KEY');

    if (!validApiKey) {
      console.warn('API_KEY not set in environment variables');
      return false;
    }

    if (apiKey === validApiKey) {
      return true;
    }

    throw new UnauthorizedException('Invalid or missing API Key');
  }
}
