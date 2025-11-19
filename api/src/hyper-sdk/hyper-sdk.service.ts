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
  // async utmvc(html: string, cookies: Cookie[]) {
  //   // Parse script path from content

  //   const scriptPath = parseUtmvcScriptPath(html);

  //   // Generate unique submit path
  //   const submitPath = generateUtmvcScriptPath();

  //   // Extract session IDs from cookies
  //   const sessionIds = getSessionIds(cookies);
  //   const result = await generateUtmvcCookie(
  //     this.session,
  //     new UtmvcInput(this.userAgent, scriptPath, sessionIds),
  //     // utmvc input fields
  //   );
  //   this.logger.log({ html: html.slice(0, 100), cookies });
  //   return;

  //   const utmvcCookie = result.payload;
  //   const swhanedl = result.swhanedl;
  // }
  getIncapsulaSessionIds(cookies: Cookie[]) {
    return getSessionIds(cookies);
  }
  parseUtmvcResourcePath(html: string) {
    return parseUtmvcScriptPath(html);
  }
  async getUtmvcScript(resourcePath: string, cookies: Cookie[]): Promise<string> {
    const cookieString = transformCookiesToCookieString(cookies);
    const url = this.configService.get<string>('URL_TO_PARSE')! + resourcePath;
    const resp = await axios.get(url, {
      headers: {
        'User-Agent': this.userAgent,
        Cookie: cookieString,
      },
    });
    return resp.data as string;
  }
  async getReeseScript(resourcePath: string, cookies: Cookie[]) {
    const cookieString = transformCookiesToCookieString(cookies);
  }
}
