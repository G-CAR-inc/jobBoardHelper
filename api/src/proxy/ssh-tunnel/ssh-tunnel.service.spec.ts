import { Test, TestingModule } from '@nestjs/testing';
import { SshTunnelService } from './ssh-tunnel.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('SshTunnelService', () => {
  let service: SshTunnelService;
  let config: ConfigService;

  let module: TestingModule;
  const logger = new Logger('SSH SERVICE SPEC');
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [SshTunnelService],
    })
      .setLogger(new Logger())
      .compile();
    config = module.get<ConfigService>(ConfigService);
    service = module.get<SshTunnelService>(SshTunnelService);
  });

  // it('should be defined', () => {
  //   expect(service).toBeDefined();
  // });
  it('should log config', () => {
    // Option 1: Log a specific variable to see if it loaded
    logger.log(`USE_PROXY: ${config.get('USE_PROXY')}`);
    // config.set('USE_PROXY',0)
    // module.init()
    // module.close()
  });
  it('should return proxy ip', () => {
    module.init();
  });
});
