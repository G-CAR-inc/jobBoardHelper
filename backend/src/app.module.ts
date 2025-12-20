import { Module } from '@nestjs/common';
import { DubizzleModule } from './dubizzle/dubizzle.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProxyModule } from './proxy/proxy.module';
import { ScheduleModule } from '@nestjs/schedule';
import { VertexModule } from './vertex/vertex.module';

@Module({
  imports: [DubizzleModule, ConfigModule.forRoot({ isGlobal: true }), PrismaModule, ProxyModule, ScheduleModule.forRoot(), VertexModule],
})
export class AppModule {}
