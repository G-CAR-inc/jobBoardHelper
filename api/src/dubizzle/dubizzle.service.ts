import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DubizzleService {
  constructor(private readonly httpService: HttpService) {
     Logger.log({cookie:process.env.reese84}) 
  }
  async getTokens() {   
    console.log({cookie:process.env.test}) 
  }
}
