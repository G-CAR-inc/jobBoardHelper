// src/dubizzle/dubizzle.controller.ts
import { Body, Controller, Get, Logger, Post, Query, Req, UseGuards } from '@nestjs/common';
import { DubizzleService } from './dubizzle.service';
import { ApiKeyGuard } from './guards/api-key/api-key.guard';
@Controller('dubizzle')
@UseGuards(ApiKeyGuard) // Protects all endpoints in this controller
export class DubizzleController {
  private readonly logger = new Logger(DubizzleController.name);

  constructor(private readonly dubizzleService: DubizzleService) {}

  @Get('magic-link')
  async triggerAuthFlow() {
    this.logger.log('Triggering auth flow via GET /magic-link');
    await this.dubizzleService.requestMagicLink();
    return { message: 'Auth flow triggered' };
  }

  @Post('magic-link')
  async receiveMagicLink(@Body() body: { magic_link: string }) {
    const magicLink = body.magic_link;
    this.logger.log(`Received Magic Link: ${magicLink}`);
    await this.dubizzleService.processMagicLink(magicLink);
    return { message: 'Magic link received and logged' };
  }
  @Get('cookies')
  async getCookieState(@Query('domain') domain: string) {
    return await this.dubizzleService.cookieJar.getCookies(`https://${domain}`);
  }
}
