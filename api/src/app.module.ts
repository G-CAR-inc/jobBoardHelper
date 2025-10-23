import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DubizzleModule } from './dubizzle/dubizzle.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DubizzleModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
