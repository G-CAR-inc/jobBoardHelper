import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DubizzleModule } from './dubizzle/dubizzle.module';
import { ConfigModule } from '@nestjs/config';
import { PuppeteerModule } from './puppeteer/puppeteer.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProxyModule } from './proxy/proxy.module';

@Module({
  imports: [DubizzleModule, ConfigModule.forRoot({ isGlobal: true }), PuppeteerModule, PrismaModule, ProxyModule],
})
export class AppModule {}
