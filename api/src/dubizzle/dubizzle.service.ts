import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { transformCookiesToCookieString } from '../utils/shared/srared.utils';
import { PrismaService } from '../prisma/prisma.service';
import { Cookie } from 'src/utils/shared/shared.types';
@Injectable()
export class DubizzleService implements OnModuleInit {
  private readonly logger = new Logger(DubizzleService.name);
  private currentSessionToken: string | null = null;
  private currentRefreshToken: string | null = null;
  private reese84Cookie: string | null = null;
  private utmvcCookie: string | null = process.env.___utmvc || null;

  private urlToParse: string;
  private userAgent: string;

  private reeseResourcePath: string;

  //domains
  private jobsDomain: string;
  private uaeDomain: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const userAgent = this.configService.get<string>('USER_AGENT');

    const urlToParse = this.configService.get<string>('URL_TO_PARSE');

    const reeseResourcePath = this.configService.get<string>('REESE_RESOURCE_PATH');
    const jobsDomain = this.configService.get<string>('JOBS_DOMAIN');
    const uaeDomain = this.configService.get<string>('UAE_DOMAIN');

    const errors: string[] = [];
    if (!urlToParse) {
      errors.push(`Config error. URL_TO_PARSE is can not be reached. ${new Date()}`);
    }
    if (!userAgent) {
      errors.push(`Config error. USER_AGENT is can not be reached. ${new Date()}`);
    }
    if (!jobsDomain) {
      errors.push(`Config error. JOBS_DOMAIN is can not be reached. ${new Date()}`);
    }
    if (!uaeDomain) {
      errors.push(`Config error. UAE_DOMAIN is can not be reached. ${new Date()}`);
    }
    if (!reeseResourcePath) {
      errors.push(`Config error. REESE_RESOURCE_PATH is can not be reached. ${new Date()}`);
    }
    if (errors.length > 0) {
      const errorsStringified = errors.join('\n\n');
      this.logger.error(errorsStringified);
      throw new Error(errorsStringified);
    }

    this.urlToParse = urlToParse!;
    this.userAgent = userAgent!;
    this.reeseResourcePath = reeseResourcePath!;
    this.jobsDomain = jobsDomain!;
    this.uaeDomain = uaeDomain!;
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
    const url = this.urlToParse + '/';
    const headers = {
      // 'Content-Type': 'application/json; charset=utf-8',
      // Host: 'jobs.dubizzle.com',
      // Referer: 'https://jobs.dubizzle.com/jobs/',
      // Accept: 'application/json',
      // 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
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

  async scrap() {
    this.logger.log('[START] scrapping...');
    //1 GET INDEX.HTML
    const { cookies, html } = await this.getIndexHtml();
    const cookieString = transformCookiesToCookieString(cookies);
    this.logger.log(`[PARSING]`, { html: html.slice(0, 100), cookies });

    //2 GET/We-a-did-and-He-him-as-desir-call-their-Banquo-B
    const reeseUrl = this.urlToParse + this.reeseResourcePath;
    const { data: reeseScript } = await axios.get(reeseUrl, {
      headers: {
        'User-Agent': this.userAgent,
        Cookie: cookieString,
      },
    });
    this.logger.log(`[FETCHED REESE84 SCRIPT]`, { reeseScript: reeseScript.slice(0, 100) });

    //3 GET /_Incapsula_Resource?SWJIYLWA=719....
    // const utmvcResource = this.hyperSdk.parseUtmvcResourcePath(html)!;
    // this.logger.log(`[PARSING] utmvc path: ${utmvcResource}`);
    // const utmvcUrl = this.urlToParse + utmvcResource;
    // const { data: utmvcScript } = await axios.get(utmvcUrl, {
    //   headers: {
    //     'User-Agent': this.userAgent,
    //     Cookie: cookieString,
    //   },
    // });

    // this.logger.log(`[FETCHED UTMVC SCRIPT]`, { utmvcScript: utmvcScript.slice(0, 100) });

    // 4 https://uae.dubizzle.com/en/user/auth/       ===> PARDON OUR INTERAPTION....
    // ====> HTML ===> PARSING...===>/Spurre-Onell-vp-Ente... script

    //HYPER SDK MAGIC to get reese84 and utmvc

    // 5 https://uae.dubizzle.com/Spurre-Onell-vp-Enter-feed-ere-Yourthe-away-riso/4088261707997073925?s=FtKYLY56 [FROM STEP 4]

    // HYPER SDK MAGIC to get new reese84
    // 6
  }
  async testSdk() {
    // this.logger.log(this.hyperSdk.onModuleInit.toString());
  }
}
