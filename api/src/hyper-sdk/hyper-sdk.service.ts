import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Session } from 'hyper-sdk-js';
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
    // this.session = new Session(apiKey!);
  }
}
