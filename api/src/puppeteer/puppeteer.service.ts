import { ConfigService } from '@nestjs/config';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';

@Injectable()
export class PuppeteerService implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}
  onModuleInit() {}
}
