import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Session } from 'hyper-sdk-js';
import { UtmvcInput, generateUtmvcCookie } from 'hyper-sdk-js';
@Injectable()
export class HyperSdkService implements OnModuleInit {
  private readonly logger = new Logger(HyperSdkService.name);
  constructor(
    private session: Session,
    private configService: ConfigService,
  ) {}
  onModuleInit() {
    const apiKey = this.configService.get<string>('HYPER_SDK_API_KEY');
    // console.log({apiKey})
    this.logger.log({ apiKey });
    if (!apiKey) {
      throw new Error(`Config error. HYPER_SDK_API_KEY is can not be reached. ${new Date()}`);
    }
    this.session = new Session(apiKey!);

    this.logger.log(this.session);

    return true;
  }
  async utmvc() {
    // const result = await generateUtmvcCookie(
    //   this.session,
    //   new UtmvcInput(),
    //   // utmvc input fields
    // );

    // const utmvcCookie = result.payload;
    // const swhanedl = result.swhanedl;
  }
}
