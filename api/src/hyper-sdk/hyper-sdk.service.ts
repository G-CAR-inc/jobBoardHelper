import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { log } from 'console';
import { Cookie, Session } from 'hyper-sdk-js';
import { UtmvcInput, generateUtmvcCookie, parseUtmvcScriptPath, generateUtmvcScriptPath, getSessionIds, isSessionCookie } from 'hyper-sdk-js';

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
    // console.log({apiKey})
    this.logger.log({ apiKey });
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

    this.logger.log('\n\n\n\n TEEEST',this.session, this.userAgent,'\n\n\n\n');

    return true;
  }
  async utmvc(html: string, cookies: Cookie[]) {
    // Parse script path from content

    this.logger.log({ html: html.slice(0, 100), cookies });

    const scriptPath = parseUtmvcScriptPath(html);

    // Generate unique submit path
    const submitPath = generateUtmvcScriptPath();

    // Extract session IDs from cookies
    const sessionIds = getSessionIds(cookies);
    return;

    const result = await generateUtmvcCookie(
      this.session,
      new UtmvcInput(),
      // utmvc input fields
    );
    const utmvcCookie = result.payload;
    const swhanedl = result.swhanedl;
  }
  async scriptParsing() {
    // Parse script path from content
    const scriptPath = parseUtmvcScriptPath(scriptContent);

    // Generate unique submit path
    const submitPath = generateUtmvcScriptPath();

    // Extract session IDs from cookies
    const sessionIds = getSessionIds(cookies);
  }
}
