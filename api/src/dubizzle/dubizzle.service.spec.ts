import { Test, TestingModule } from '@nestjs/testing';
import { DubizzleService } from './dubizzle.service';
import { Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

describe('DubizzleService', () => {
  let service: DubizzleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule.register({
          baseURL: 'https://jobs.dubizzle.com',
          timeout: 5000, // 5 seconds timeout
          maxRedirects: 5,
        }),
      ],
      providers: [DubizzleService],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<DubizzleService>(DubizzleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should return index.html', async () => {
    const resp = await service.getIndexHtml();
  });
});
//
