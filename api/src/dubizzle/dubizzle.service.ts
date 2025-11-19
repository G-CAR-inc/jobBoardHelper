import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { firstValueFrom, catchError } from 'rxjs';
import * as utvcBody from '../../token.json';
import { reese84Token } from './types';
import { HyperSdkService } from '../hyper-sdk/hyper-sdk.service';
import { Cookie } from 'hyper-sdk-js';
@Injectable()
export class DubizzleService implements OnModuleInit {
  private readonly logger = new Logger(DubizzleService.name);
  private currentSessionToken: string | null = null;
  private currentRefreshToken: string | null = null;
  private reese84Cookie: string | null = null;
  private utmvcCookie: string | null = process.env.___utmvc || null;

  private urlToParse: string;
  private userAgent: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly hyperSdk: HyperSdkService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const userAgent = this.configService.get<string>('USER_AGENT');

    const urlToParse = this.configService.get<string>('URL_TO_PARSE');

    const errors: string[] = [];
    if (!urlToParse) {
      errors.push(`Config error. URL_TO_PARSE is can not be reached. ${new Date()}`);
    }
    if (!userAgent) {
      errors.push(`Config error. USER_AGENT is can not be reached. ${new Date()}`);
    }
    if (errors.length > 0) {
      const errorsStringified = errors.join('\n\n');
      this.logger.error(errorsStringified);
      throw new Error(errorsStringified);
    }

    this.urlToParse = urlToParse!;
    this.userAgent = userAgent!;
  }
  async getGoogleIndexHtml(): Promise<{ cookies: Cookie[]; html: string }> {
    const url = 'https://www.google.com/';
    const headers = {
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    };

    try {
      const resp = await axios.get<string>(url, { headers });
      const cookies = resp.headers['set-cookie'];
      const parsedCookies: Cookie[] = this.parseCookies(cookies!);
      return { cookies: parsedCookies, html: resp.data as string };
    } catch (error: any) {
      this.logger.error(`Failed to fetch Google index page`, error.stack);
      throw new Error(`Failed to fetch Google index page. Status: ${error.response?.status || 'Network Error'}`);
    }
  }

  private parseCookies(cookieStrings: string[]): Cookie[] {
    return cookieStrings.map((cookieStr) => {
      const [nameValue] = cookieStr.split(';');
      const [name, ...valueParts] = nameValue.split('=');
      const value = valueParts.join('=');

      return { name, value };
    });
  }
  async getIndexHtml(): Promise<{ cookies: Cookie[]; html: string }> {
    const url = 'https://jobs.dubizzle.com/';
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      Host: 'jobs.dubizzle.com',
      Referer: 'https://jobs.dubizzle.com/jobs/',
      Accept: 'application/json',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    };

    try {
      const resp = await axios.get<string>(url, { headers });
      const cookies = resp.headers['set-cookie'];
      const parsedCookies: Cookie[] = this.parseCookies(cookies!);

      return { cookies: parsedCookies, html: resp.data as string };
    } catch (error: any) {
      this.logger.error(`Failed to fetch Google index page`, error.stack);
      throw new Error(`Failed to fetch Google index page. Status: ${error.response?.status || 'Network Error'}`);
    }
  }
  /**
   * Extracts the Incapsula resource path from the HTML.
   * @param htmlContent The string content of the index.html page.
   * @returns The extracted resource path (e.g., '/_Incapsula_Resource?_') or null.
   */
  private extractIncapsulaResource(htmlContent: string): string | null {
    // The regex: finds src="(/_Incapsula_Resource\?[^"]*)"
    // The parentheses ( ) create a capturing group around the path you want.
    const regex = /src="(\/_Incapsula_Resource\?[^"]*)"/i;

    // The .exec() method executes a search for a match in a specified string.
    const match = regex.exec(htmlContent);

    // match[1] holds the content of the first capturing group (the resource path).
    // match[0] would be the full match, including src="...".
    return match ? match[1] : null;
  }

  async fetchIncapsulaJs(resourcePath: string): Promise<string> {
    const baseUrl = 'https://jobs.dubizzle.com';
    const url = `${baseUrl}${resourcePath}`;

    this.logger.log(`Fetching Incapsula JS from: ${url}`);

    // We use axios directly here as we only need the raw content, not the reactive pipe features.
    try {
      const resp = await axios.get(url, {
        headers: {
          // You may need to adjust these headers to mimic a real browser request
          Accept: 'application/javascript, */*;q=0.8',
          Host: 'jobs.dubizzle.com',
          Referer: 'https://jobs.dubizzle.com/', // Must refer to the main page
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        },
      });

      return resp.data as string;
    } catch (error) {
      this.logger.error(`Failed to fetch Incapsula JS from ${url}`, (error as AxiosError).stack);
      throw new Error(`Failed to fetch Incapsula JS. Status: ${(error as AxiosError).response?.status || 'Network Error'}`);
    }
  }
  async scrap() {
    console.log('successfully launched');
    const { cookies, html } = await this.getGoogleIndexHtml();
    // this.logger.log({ html, cookies });
    this.hyperSdk.utmvc(html, cookies);
    // const indexHtml = await this.getIndexHtml();
    // const incapsulaResoursePath = this.extractIncapsulaResource(indexHtml);
    // const _Incapsula_Resource = await this.fetchIncapsulaJs(incapsulaResoursePath!);
    // this.logger.log({ _Incapsula_Resource, incapsulaResoursePath });
    // return _Incapsula_Resource;
  }
  async testSdk() {
    this.logger.log(this.hyperSdk.onModuleInit.toString());
    this.logger.log(this.hyperSdk.utmvc.toString());
  }
}
