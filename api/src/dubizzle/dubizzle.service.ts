import { reese84Token } from './types/auth.types';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
// Import CookieJar from tough-cookie
import { Cookie, CookieJar } from 'tough-cookie';
// Import helper to promisify if needed, though modern tough-cookie uses promises for some methods,
// usually setCookie/getCookieString are async in the latest versions or require callbacks.
// We will assume the standard async usage.

import { BrowserSessionRepository } from './repositories/browser-session.repository';
import {
  generateUtmvcScriptPath,
  getSessionIds,
  parseUtmvcScriptPath,
  parseDynamicReeseScript,
  // We will construct the Cookie type manually or map to it
  Cookie as HyperCookie,
  Reese84Input,
  Session,
  generateReese84Sensor,
} from 'hyper-sdk-js';
import { getPublicIp } from '../utils/shared/srared.utils';
import { reese84Token } from './types';
@Injectable()
export class DubizzleService implements OnModuleInit {
  private readonly logger = new Logger(DubizzleService.name);

  private urlToParse: string;
  private userAgent: string;
  private acceptLanguage: string;

  private reeseResourcePath: string;

  //domains
  private jobsDomain: string;
  private uaeDomain: string;

  private cookieJar = new CookieJar();
  constructor(
    private readonly http: HttpService,
    private readonly browserSessionRepo: BrowserSessionRepository,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const userAgent = this.config.getOrThrow<string>('USER_AGENT');

    const urlToParse = this.config.getOrThrow<string>('URL_TO_PARSE');

    const reeseResourcePath = this.config.getOrThrow<string>('REESE_RESOURCE_PATH');
    const jobsDomain = this.config.getOrThrow<string>('JOBS_DOMAIN');
    const uaeDomain = this.config.getOrThrow<string>('UAE_DOMAIN');
    const acceptLanguage = this.config.getOrThrow<string>('ACCEPT_LANGUAGE');

    // const {
    //   data: {
    //     versions: [agent],
    //   },
    // } = await this.getUserAgents();
    // this.userAgent = agent.name;
    this.userAgent = userAgent;
    this.acceptLanguage = acceptLanguage;

    this.urlToParse = urlToParse;
    this.reeseResourcePath = reeseResourcePath;
    this.jobsDomain = jobsDomain;
    this.uaeDomain = uaeDomain;
  } /**
   * Helper: Stores an array of Set-Cookie strings into the jar.
   * tough-cookie validates the domain, so we must provide the 'currentUrl'.
   */
  private async updateCookieJar(setCookies: string[] | undefined, currentUrl: string) {
    if (!setCookies || !Array.isArray(setCookies)) return;

    for (const cookieStr of setCookies) {
      try {
        // setCookie is async
        await this.cookieJar.setCookie(cookieStr, currentUrl);
      } catch (err) {
        this.logger.warn(`Failed to set cookie: ${cookieStr} for url ${currentUrl}`, err);
      }
    }
  }

  /**
   * Helper: Gets the Cookie header string for a specific URL.
   */
  private getCookieString(url: string): Promise<string> {
    return this.cookieJar.getCookieString(url);
  }

  /**
   * Helper: Extracts cookies from the jar and maps them to the format
   * expected by hyper-sdk-js (Simple key-value objects).
   */
  private async getHyperCookies(url: string): Promise<HyperCookie[]> {
    const cookies = await this.cookieJar.getCookies(url);
    return cookies.map((c) => ({
      name: c.key,
      value: c.value,
    }));
  }
  getUserAgents() {
    return this.fetch({ url: 'https://versionhistory.googleapis.com/v1/chrome/platforms/win/channels/stable/versions/' });
  }
  async bypassIncapsula(rootUrl: string) {
    this.logger.log('[START] scrapping...');
    const rootUrlObj = new URL(rootUrl);

    const domain = rootUrlObj.host;
    const protocol = rootUrlObj.protocol;
    const { ip } = await getPublicIp();
    this.logger.log({
      message: 'bypass config',
      ip,
      protocol,
      domain,
      userAgent: this.userAgent,
      acceptLanguage: this.acceptLanguage,
    });
    //1 GET INDEX.HTML
    const { data: indexHtml, setCookie: indexHtmlSetCookies } = await this.fetch({ url: rootUrl });
    this.logger.log({ indexHtml });
    // UTMVC
    const utmvcScriptPath = parseUtmvcScriptPath(indexHtml);
    const submitPath = generateUtmvcScriptPath();
    let utmvc: string;
    if (utmvcScriptPath) {
      //TODO: implement utmvc logic
    }
    //DYNAMIC REESE84
    let dynamicScript: {
      sensorPath: string;
      scriptPath: string;
    };
    let lastContentType: string;
    let dynamicReeseScript: string;
    let currentHtml = indexHtml;

    do {
      dynamicScript = parseDynamicReeseScript(currentHtml, rootUrl);
      // get reese84 sensor script
      const dynamicReeseUrl = protocol + domain + dynamicScript.scriptPath;
      const { data: script, contentType } = await this.fetch({
        url: dynamicReeseUrl,
      });
      lastContentType = contentType as string;
      dynamicReeseScript = script;
      this.logger.log({
        message: 'Dynamic script fetched',
        // scriptPreview: dynamicReeseScript.slice(0, 100),
        dynamicReeseScript,
        contentType,
      });
      if (contentType == 'text/html') {
        currentHtml = script;
      } else {
        break;
      }
    } while (lastContentType == 'text/html');
    return;

    //cookies
    const hyperCookies = await this.getHyperCookies(rootUrl);

    //sesion ids
    const sessionIds = getSessionIds(hyperCookies);
    this.logger.log({
      message: 'State before dynamic script fetch',

      sessionIds,
      resourcePath: utmvcScriptPath,
      dynamicScript,
      submitPath,
    });

    // Generate the sensor payload via hypersoultion sdk
    const reeseInput = new Reese84Input(this.userAgent, ip, this.acceptLanguage, rootUrl, dynamicReeseScript, dynamicScript.scriptPath);
    this.logger.log({ reeseInput });
    const session = new Session(this.config.getOrThrow<string>('HYPER_SDK_API_KEY'));
    const sensor = await generateReese84Sensor(session, reeseInput);
    this.logger.log({ message: 'sensor solved', sensor: sensor.slice(0, 100) });

    //send the soved captcha to dubizzle back

    const reeeseSensorUrl = protocol + domain + dynamicScript.sensorPath;
    const reeseTimeStamp = new Date();
    const { data: reeseToken } = (await this.fetch({ url: reeeseSensorUrl, body: sensor })) as { data: reese84Token };
    this.logger.log({ message: 'dubizzle response', reeseToken });
    await this.setReese84Cookie(reeseToken);

    return;
  }

  async authorize() {
    const rootUrl = 'https://uae.dubizzle.com/en/user/auth/';
    const incapsulaJs = await this.bypassIncapsula(rootUrl);
  }
  async fetch(props: {
    url: string;
    headers?: Record<string, string>;
    body?: any;
    access_token?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; // Optional: infer from body if missing
  }) {
    const { url, headers: customHeaders = {}, body, access_token, method } = props;
    const cookieString = await this.getCookieString(url)!;
    // 1. Construct Default Headers
    const headers = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': this.acceptLanguage,
      'User-Agent': this.userAgent,
      'x-access-token': access_token, // Custom auth header
      Cookie: cookieString,
      ...customHeaders, // Allow specific overrides
    };

    // 2. Determine HTTP Method (Default to POST if body exists, else GET)
    const requestMethod = method || (body ? 'POST' : 'GET');

    try {
      // 3. Execute Request using the underlying Axios instance
      this.logger.log(`fetching ${requestMethod} url:${url} ....\ncookies:${cookieString}`);
      const response = await this.http.axiosRef.request({
        url,
        method: requestMethod,
        headers,
        data: body,
      });
      const { data, headers: respHeaders } = response;
      const contentType = response.headers['content-type'];

      const setCookie = respHeaders['set-cookie'];
      await this.updateCookieJar(setCookie, url);
      return { data, setCookie, contentType };
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
    return this.fetch({ url, access_token, method: 'GET' });
  }
  getApplies(props: { vacancyIds: string[]; cookieString: string; access_token: string }) {
    const { vacancyIds, access_token } = props;

    return Promise.all(
      vacancyIds.map((vacancyId) => {
        const url = `${this.urlToParse}/svc/ats/api/v4/application?job_listing=${vacancyId}&is_in_pipeline=1&sort_by=created_at`;
        return this.fetch({ url, access_token, method: 'GET' });
      }),
    );
  }
  /**
   * Sets the 'reese84' cookie from the provided JSON token object.
   */
  async setReese84Cookie(tokenData: reese84Token) {
    const { token, renewInSec, cookieDomain } = tokenData;

    // 1. Construct the Cookie object
    // using tough-cookie's Cookie class ensures proper formatting
    const cookie = new Cookie({
      key: 'reese84',
      value: token,
      domain: cookieDomain,
      path: '/',
      maxAge: renewInSec, // 'renewInSec' maps directly to Max-Age
      secure: true, // Usually required for these security tokens
      httpOnly: true, // Best practice
    });

    // 2. Determine a valid URL for the context
    // tough-cookie requires a URL to validate the domain.
    // We strip any leading '.' from the domain (e.g. .dubizzle.com -> dubizzle.com)
    const normalizedDomain = cookieDomain.startsWith('.') ? cookieDomain.substring(1) : cookieDomain;
    const contextUrl = `https://${normalizedDomain}/`;

    // 3. Store it in the jar
    try {
      await this.cookieJar.setCookie(cookie, contextUrl);
      this.logger.log(`Successfully set reese84 cookie for ${cookieDomain}`);
    } catch (error) {
      this.logger.error(`Failed to set reese84 cookie: ${error.message}`);
    }
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

    const { data: vacancyResp } = await this.getVacancies({ cookieString, access_token });
    return;
    const { results: vacancies } = vacancyResp;
    const vacancyIds: string[] = vacancies.map((v: { id: string }) => v.id);

    this.logger.log(vacancyIds);

    //APPLIES

    const [applies] = await this.getApplies({ vacancyIds, cookieString, access_token });
    this.logger.log(applies.results[0]);
  }
}
