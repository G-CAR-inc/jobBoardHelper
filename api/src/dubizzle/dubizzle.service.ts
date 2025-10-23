import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import { firstValueFrom, catchError } from 'rxjs';

@Injectable()
export class DubizzleService implements OnModuleInit {
  private readonly logger = new Logger(DubizzleService.name);
  private currentSessionToken: string | null = null;
  private currentRefreshToken: string | null = null;

  constructor(private readonly httpService: HttpService) {}

  /**
   * onModuleInit is the proper lifecycle hook for asynchronous initialization
   * logic like initial API calls that require 'await'.
   */
  async onModuleInit() {
    this.logger.log('Starting initial login process...');
    // The POST call is now correctly awaited
    const loginResponse = await this.login();
    this.logger.log(loginResponse?.data);
    //   if (loginResponse) {
    //       // Assuming the response contains a session token or similar data
    //       this.currentSessionToken = loginResponse.data?.token || 'N/A';
    //       this.logger.log(`Initial login successful. Token acquired: ${this.currentSessionToken!.substring(0, 10)}...`);
    //   }
  }

  // Renamed to 'login' for clarity, reflecting the endpoint's purpose
  async login() {
    const reese84Cookie = process.env.reese84;
    this.logger.log({ cookie: reese84Cookie });

    try {
      // FIX IMPLEMENTED: Use firstValueFrom to convert the Observable to a Promise.
      const response: AxiosResponse = await firstValueFrom(
        this.httpService
          .post('/en/auth/login/v6/', null, {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              // Corrected 'Coockie' typo to 'Cookie'
              Cookie: `reese84=${reese84Cookie}`,
              Accept: 'application/json',
              'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
            },
          })
          .pipe(
            // Catch HTTP/network errors within the Observable pipe
            catchError((error: AxiosError) => {
              this.logger.error(`Login POST failed: ${error.message}`, error.stack);
              // Throw an error to be caught by the outer try/catch block
              throw new Error(`External login failed. Status: ${error.response?.status || 'Network Error'}`);
            }),
          ),
      );
      const { refresh_token, access_token } = response.data as { refresh_token: string; access_token: string };
      this.currentRefreshToken = refresh_token;
      this.currentSessionToken = access_token;
      this.logger.log('Login request completed successfully.');
      return { refresh_token, access_token };
    } catch (e) {
      // Handle specific error from the catchError pipe or generic issues
      this.logger.error('Failed to complete login request.', e.message);
      return null;
    }
  }
}
