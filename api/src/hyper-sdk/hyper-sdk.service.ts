import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { Cookie, Session } from 'hyper-sdk-js';
import { UtmvcInput, generateUtmvcCookie, parseUtmvcScriptPath, generateUtmvcScriptPath, getSessionIds, isSessionCookie } from 'hyper-sdk-js';
import { transformCookiesToCookieString } from '../utils/shared/srared.utils';

@Injectable()
export class HyperSdkService implements OnModuleInit {
  private readonly logger = new Logger(HyperSdkService.name);
  private session: Session;
  private userAgent: string;
  constructor(private configService: ConfigService) {}
  onModuleInit() {
    const apiKey = this.configService.get<string>('HYPER_SDK_API_KEY');
    const userAgent = this.configService.get<string>('USER_AGENT');
    const errors: string[] = [];

    if (!apiKey) {
      errors.push(`Config error. HYPER_SDK_API_KEY is can not be reached. ${new Date()}`);
    }
    if (!userAgent) {
      errors.push(`Config error. USER_AGENT is can not be reached. ${new Date()}`);
    }
    if (errors.length > 0) {
      const errorsStringified = errors.join('\n\n');
      this.logger.error(errorsStringified);
      throw new Error(errorsStringified);
    }
    this.session = new Session(apiKey!);
    this.userAgent = userAgent!;

    return true;
  }
  getIncapsulaSessionIds(cookies: Cookie[]) {
    return getSessionIds(cookies);
  }
  parseUtmvcResourcePath(html: string) {
    return parseUtmvcScriptPath(html);
  }
}
