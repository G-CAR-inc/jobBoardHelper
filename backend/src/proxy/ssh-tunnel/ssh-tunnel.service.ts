import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn, ChildProcess } from 'child_process';
import { SocksProxyAgent } from 'socks-proxy-agent';

@Injectable()
export class SshTunnelService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SshTunnelService.name);
  private sshProcess: ChildProcess | null = null;
  private readonly localPort = 1337; // The port for localhost:1337
  private readonly socksHost = '127.0.0.1';
  

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const useProxy:boolean=Boolean(this.config.get<number>('USE_PROXY'));
    this.logger.log({useProxy})
    if(useProxy){
      this.openTunnel()
    }
  }

  onModuleDestroy() {

    const useProxy:boolean=Boolean(this.config.get<number>('USE_PROXY'));
    this.logger.log({useProxy})
    if(useProxy){this.closeTunnel();}
  }

  private openTunnel() {
    // You should add these to your .env file
    const proxyUser = this.config.getOrThrow<string>('PROXY_USER');
    const proxyHost = this.config.getOrThrow<string>('PROXY_HOST');
    // Optional: Path to private key if not in default ~/.ssh/id_rsa
    const proxyKeyPath = this.config.getOrThrow<string>('PROXY_KEY_PATH');

    this.logger.log(`Starting SSH Tunnel to ${proxyUser}@${proxyHost} on port ${this.localPort}...`);
    
    // Command: ssh -D 1337 -q -C -N user@ip
    const args = [
      '-D',
      this.localPort.toString(),
      '-q', // Quiet mode
      '-C', // Compression
      '-N', // No remote command (just forward)
      '-o',
      'StrictHostKeyChecking=no', // Useful for automation/CI
      `${proxyUser}@${proxyHost}`,
    ];

    // If you need a specific key file:
    args.unshift('-i', proxyKeyPath);

    this.sshProcess = spawn('ssh', args);

    this.sshProcess.on('error', (err) => {
      this.logger.error('Failed to start SSH tunnel', err);
    });

    this.sshProcess.on('close', (code) => {
      if (code !== 0 && code !== null) {
        // null happens when we kill it intentionally
        this.logger.warn(`SSH tunnel process exited with code ${code}`);
      } else {
        this.logger.log('SSH tunnel process closed gracefully');
      }
    });
  }

  private closeTunnel() {
    if (this.sshProcess) {
      this.logger.log('Closing SSH Tunnel...');
      this.sshProcess.kill(); // Sends SIGTERM
      this.sshProcess = null;
    }
  }

  /**
   * Returns an HTTP/HTTPS Agent configured to use the SOCKS tunnel.
   * Pass this to Axios.
   */
  getProxyAgent(): SocksProxyAgent {
    return new SocksProxyAgent(`socks5://${this.socksHost}:${this.localPort}`);
  }
}
