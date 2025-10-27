import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import { firstValueFrom, catchError } from 'rxjs';
import * as utvcBody from '../../token.json';
import { reese84Token } from './types';
@Injectable()
export class DubizzleService implements OnModuleInit {
  private readonly logger = new Logger(DubizzleService.name);
  private currentSessionToken: string | null = null;
  private currentRefreshToken: string | null = null;
  private reese84Cookie: string | null = null;
  private utmvcCookie: string | null = process.env.___utmvc || null;

  constructor(private readonly httpService: HttpService) {}

  async onModuleInit() {
    this.logger.log('Starting initial login process...');
    if (!this.utmvcCookie) {
      const errorBody = {
        message: `Uninitialized ___utmvc cookie. The entire module can not be initiated.`,
        utcv: this.utmvcCookie,
        date: new Date(),
      };
      this.logger.error(errorBody);
      throw new Error(JSON.stringify(errorBody));
    }
    const reese84 = await this.getReese84Token();
    const { token } = reese84!;
    this.reese84Cookie = token;

    const { access_token, refresh_token } = await this.login();
    this.currentRefreshToken = refresh_token;
    this.currentSessionToken = access_token;
    // The POST call is now correctly awaited
    // const loginResponse = await this.login();
    // // this.logger.log(loginResponse);

    const refresh = await this.refreshAcessToken();
    this.logger.log(refresh);
    // const vacancies = await this.getLiveVacancies();
    // this.logger.log(vacancies);
    const info = await this.getInfo();
    this.logger.log(info);
  }

  async login() {
    const reese84Cookie = this.reese84Cookie!;

    try {
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
            catchError((error: AxiosError) => {
              this.logger.error(`Login POST failed: ${error.message}`, error.stack);
              throw new Error(`External login failed. Status: ${error.response?.status || 'Network Error'}`);
            }),
          ),
      );
      const { refresh_token, access_token } = response.data as { refresh_token: string; access_token: string };

      this.logger.log('Login request completed successfully.');
      return { refresh_token, access_token };
    } catch (e) {
      // Handle specific error from the catchError pipe or generic issues
      this.logger.error('Failed to complete login request.', e.message);
      return null;
    }
  }
  async refreshAcessToken() {
    const reese84Cookie = process.env.reese84;
    const access_token = this.currentSessionToken || process.env.access_token;
    const refresh_token = this.currentRefreshToken || process.env.refresh_token;
    this.logger.log({ message: 'refreshing...', reese84Cookie, access_token, refresh_token });
    const resp = await firstValueFrom(
      this.httpService
        .post('/en/auth/refresh_token/', null, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            // Corrected 'Coockie' typo to 'Cookie'
            Cookie: `reese84=${reese84Cookie}`,
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',

            'x-access-token': access_token,
            'x-refresh-token': refresh_token,
            Accept: 'application/json',
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
    const tokens = resp.data as { refresh_token: string; access_token: string };
    this.currentRefreshToken = tokens.refresh_token;
    this.currentSessionToken = tokens.access_token;
    this.logger.log('refresh token request completed successfully.');
    return tokens;
  }
  async getLiveVacancies() {
    const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
    const resp = await firstValueFrom(
      this.httpService
        .get('/svc/ats/api/v1/listing?status=live', {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            // Corrected 'Coockie' typo to 'Cookie'
            'User-Agent': userAgent,
            'x-access-token': this.currentSessionToken,
            Accept: 'application/json',
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
    return resp.data;
  }
  async getReese84Token() {
    const utvcCookie = this.utmvcCookie!;

    this.logger.log({ cookie: utvcCookie.substring(0, 30) + '...' });

    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService
          .post('/We-a-did-and-He-him-as-desir-call-their-Banquo-B?d=jobs.dubizzle.com', utvcBody, {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              Host: 'jobs.dubizzle.com',
              Referer: 'https://jobs.dubizzle.com/jobs/',
              Cookie: `___utmvc=${utvcCookie}`,
              Accept: 'application/json',
              'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
            },
          })
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(`Login POST failed: ${error.message}`, error.stack);
              throw new Error(`External login failed. Status: ${error.response?.status || 'Network Error'}`);
            }),
          ),
      );

      const data = response.data as reese84Token;
      return data;
    } catch (e) {
      this.logger.error('Failed to complete login request.', (e as Error).message);
      return null;
    }
  }
  async getInfo() {
    const reese84Cookie = process.env.reese84;
    const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
    const resp = await firstValueFrom(
      this.httpService
        .get('/en/auth/info/', {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',

            'User-Agent': userAgent,
            'x-access-token': this.currentSessionToken,
            Accept: 'application/json',
            Cookie: `reese84=${reese84Cookie}`,
          },
        })
        .pipe(
          // Catch HTTP/network errors within the Observable pipe
          catchError((error: AxiosError) => {
            // this.logger.error(`info fetching error: ${error.message}`, error);
            // Throw an error to be caught by the outer try/catch block
            throw new Error(`External login failed. Status: ${error.response?.status || 'Network Error'}`);
          }),
        ),
    );
    return resp.data;
  }
}
