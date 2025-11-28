import { Test, TestingModule } from '@nestjs/testing';
import { DubizzleService } from './dubizzle.service';
import { Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { BrowserSessionRepository } from './repositories/browser-session.repository';
import { PrismaModule } from '../prisma/prisma.module';
describe('DubizzleService', () => {
  let service: DubizzleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          // envFilePath: '.env.test',
        }),
        HttpModule.register({
          baseURL: 'https://jobs.dubizzle.com',
          timeout: 5000,
          maxRedirects: 5,
        }),
        PrismaModule,
      ],
      providers: [DubizzleService, BrowserSessionRepository],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<DubizzleService>(DubizzleService);
    await module.init();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should return valid browser versions', async () => {
    const {
      data: { versions: userAgents },
    } = await service.getUserAgents();
    // Logger.log(userAgents);
    expect(Array.isArray(userAgents)).toBe(true);
    const [agent] = userAgents;

    expect(agent).toHaveProperty('name');
    expect(typeof agent.name).toBe('string');

    // Assert that 'version' property exists and is a string
    expect(agent).toHaveProperty('version');
    expect(typeof agent.version).toBe('string');
  });
  it('should return Incapsula resource', async () => {
    const incapsulaJs = await service.bypassIncapsula();
  });
});
//
