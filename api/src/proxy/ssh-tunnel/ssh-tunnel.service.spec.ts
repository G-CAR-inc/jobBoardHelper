import { Test, TestingModule } from '@nestjs/testing';
import { SshTunnelService } from './ssh-tunnel.service';

describe('SshTunnelService', () => {
  let service: SshTunnelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SshTunnelService],
    }).compile();

    service = module.get<SshTunnelService>(SshTunnelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
