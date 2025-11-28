import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BypassService implements OnModuleInit {
  /**
   *
   */
  constructor(private readonly cfg: ConfigService) {}
  onModuleInit() {}
  
  async bypassIncapsula() {

  }
}
