import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { transformCookiesToCookieString } from '../utils/shared/srared.utils';
import { PrismaService } from '../prisma/prisma.service';
import { Cookie } from '../utils/shared/shared.types';
import { BrowserSessionRepository } from './repositories/browser-session.repository';
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
    private readonly browserSessionRepo: BrowserSessionRepository,
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

  // async scrap() {
  //   this.logger.log('[START] scrapping...');
  //   //1 GET INDEX.HTML
  //   const { cookies, html } = await this.getIndexHtml();
  //   const cookieString = transformCookiesToCookieString(cookies);
  //   this.logger.log(`[PARSING]`, { html: html.slice(0, 100), cookies });

  //   //2 GET/We-a-did-and-He-him-as-desir-call-their-Banquo-B
  //   const reeseUrl = this.urlToParse + this.reeseResourcePath;
  //   const { data: reeseScript } = await axios.get(reeseUrl, {
  //     headers: {
  //       'User-Agent': this.userAgent,
  //       Cookie: cookieString,
  //     },
  //   });
  //   this.logger.log(`[FETCHED REESE84 SCRIPT]`, { reeseScript: reeseScript.slice(0, 100) });

  //   //3 GET /_Incapsula_Resource?SWJIYLWA=719....
  //   // const utmvcResource = this.hyperSdk.parseUtmvcResourcePath(html)!;
  //   // this.logger.log(`[PARSING] utmvc path: ${utmvcResource}`);
  //   // const utmvcUrl = this.urlToParse + utmvcResource;
  //   // const { data: utmvcScript } = await axios.get(utmvcUrl, {
  //   //   headers: {
  //   //     'User-Agent': this.userAgent,
  //   //     Cookie: cookieString,
  //   //   },
  //   // });

  //   // this.logger.log(`[FETCHED UTMVC SCRIPT]`, { utmvcScript: utmvcScript.slice(0, 100) });

  //   // 4 https://uae.dubizzle.com/en/user/auth/       ===> PARDON OUR INTERAPTION....
  //   // ====> HTML ===> PARSING...===>/Spurre-Onell-vp-Ente... script

  //   //HYPER SDK MAGIC to get reese84 and utmvc

  //   // 5 https://uae.dubizzle.com/Spurre-Onell-vp-Enter-feed-ere-Yourthe-away-riso/4088261707997073925?s=FtKYLY56 [FROM STEP 4]

  //   // HYPER SDK MAGIC to get new reese84
  //   // 6
  // }
  async fetch(props: {
    url: string;
    headers?: Record<string, string>;
    body?: any;
    cookieString: string;
    access_token: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; // Optional: infer from body if missing
  }) {
    const { url, headers: customHeaders = {}, body, cookieString, access_token, method } = props;

    // 1. Construct Default Headers
    const headers = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': this.userAgent,
      'x-access-token': access_token, // Custom auth header
      Cookie: cookieString,
      ...customHeaders, // Allow specific overrides
    };

    // 2. Determine HTTP Method (Default to POST if body exists, else GET)
    const requestMethod = method || (body ? 'POST' : 'GET');

    try {
      // 3. Execute Request using the underlying Axios instance
      const response = await this.httpService.axiosRef.request({
        url,
        method: requestMethod,
        headers,
        data: body,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`Fetch error [${requestMethod} ${url}]: ${error.message}`, error.response?.data);
      } else {
        this.logger.error(`Fetch error [${requestMethod} ${url}]: ${error}`);
      }
      throw error;
    }
  }
  getVacancies({ cookieString, access_token }: { cookieString: string; access_token: string }) {
    const url = `${this.urlToParse}/svc/ats/api/v1/listing?status=live`;
    return this.fetch({ url, cookieString, access_token, method: 'GET' });
  }
  getApplies(props: { vacancyIds: string[]; cookieString: string; access_token: string }) {
    const { vacancyIds, cookieString, access_token } = props;

    return Promise.all(
      vacancyIds.map((vacancyId) => {
        const url = `${this.urlToParse}/svc/ats/api/v4/application?job_listing=${vacancyId}&is_in_pipeline=1&sort_by=created_at`;
        return this.fetch({ url, cookieString, access_token, method: 'GET' });
      }),
    );
  }
  async scrap() {
    const domain = this.jobsDomain;
    const session = await this.browserSessionRepo.findLatestSession(domain);

    const { access_token } = session?.localStorage! as unknown as { access_token: string };
    const cookies = session?.cookies as unknown as {
      name: string;
      value: string;
      domain: string;
    }[];
    const cookieString = cookies
      .map((cookie) => ([domain, '.dubizzle.com'].includes(cookie.domain) ? `${cookie.name}=${cookie.value}` : ''))
      .filter((cookie) => !!cookie)
      .join('; ');
    this.logger.log({ cookieString });

    const vacancyResp = await this.getVacancies({ cookieString, access_token });
    const { results: vacancies } = vacancyResp;
    const vacancyIds: string[] = vacancies.map((v: { id: string }) => v.id);

    this.logger.log(vacancyIds);

    //APPLIES

    const applies = await this.getApplies({ vacancyIds, cookieString, access_token });
    this.logger.log(applies)
  }
}
