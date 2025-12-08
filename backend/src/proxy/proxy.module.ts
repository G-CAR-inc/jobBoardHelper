import { Module } from '@nestjs/common';
import { SshTunnelService } from './ssh-tunnel/ssh-tunnel.service';

@Module({
  providers: [SshTunnelService],
})
export class ProxyModule {}
