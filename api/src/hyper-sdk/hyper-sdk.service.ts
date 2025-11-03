import { Injectable, OnModuleInit } from '@nestjs/common';
import { Session } from 'hyper-sdk-js';
@Injectable()
export class HyperSdkService implements OnModuleInit {
  constructor(private session: Session) {}
  onModuleInit() {
    
    this.session = new Session('your-api-key');
  }
}
