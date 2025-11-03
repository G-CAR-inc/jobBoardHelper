import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Session } from 'hyper-sdk-js';
@Injectable()
export class HyperSdkService implements OnModuleInit {
  constructor(
    private session: Session,
    private configService: ConfigService,
  ) {}
  onModuleInit() {
    const apiKey = this.configService.get<string>('HYPER_SDK_API_KEY');

    if(!apiKey){
        throw 
    }
    this.session = new Session(apiKey!);
  }
}
