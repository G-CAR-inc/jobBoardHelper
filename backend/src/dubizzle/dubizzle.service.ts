import { reese84Token } from './types/auth.types';
import { defineConfig } from 'prisma/config';
import { Session } from './../../node_modules/.prisma/client/index.d';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { Cookie, CookieJar } from 'tough-cookie';
import {
  generateUtmvcScriptPath,
  getSessionIds,
  parseUtmvcScriptPath,
  parseDynamicReeseScript,
  Cookie as HyperCookie,
  Reese84Input,
  Session as HyperSdkSession,
  generateReese84Sensor,
  UtmvcInput,
  generateUtmvcCookie,
} from 'hyper-sdk-js';
import { getPublicIp, sleep } from '../utils/shared/srared.utils';
import { BypassRepository } from './repositories/bypass.repository';

export interface DubizzleServiceState {
  cookies: Cookie[];
  localStorage: {
    access_token: string;
    refresh_token: string;
  };
}

@Injectable()
export class DubizzleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DubizzleService.name);

  private userAgent: string;
  private acceptLanguage: string;
  private accept: string;

  private ip: string;
  private email: string;
  private password: string;

  private sdkUsage: number = 0;

  public cookieJar = new CookieJar();

  private access_token: string;
  private refresh_token: string;
  private reese84: Cookie;
  constructor(
    @Inject() private readonly http: HttpService,
    @Inject() private readonly config: ConfigService,
    @Inject() private readonly bypassRepo: BypassRepository,
  ) {}

  async onModuleInit() {
    const userAgent = this.config.getOrThrow<string>('USER_AGENT');

    const acceptLanguage = this.config.getOrThrow<string>('ACCEPT_LANGUAGE');

    const accept = this.config.getOrThrow<string>('ACCEPT');

    const { ip } = await getPublicIp();

    this.userAgent = userAgent;
    this.acceptLanguage = acceptLanguage;
    this.accept = accept;

    this.ip = ip;

    const email = this.config.getOrThrow<string>('DUBIZZLE_EMAIL');
    const password = this.config.getOrThrow<string>('DUBIZZLE_PASSWORD');

    this.email = email;
    this.password = password;
    const { success } = await this.loadLatestModuleState();
    this.logger.log(`module latest stating loading up status: ${success}`);
    if (!success) {
      this.logger.warn(
        `There is no initial session to prolong. Magic link passing required. Pleace request \n\n [GET] /dubizzle/magic-link then [POST] /dubizzle/magic-link\n\n`,
      );
    }
    const { remains, result } = await this.checkIfReeseValid();
    this.logger.log(`last reese84 token state: remains: ${remains}, isActive: ${result}`);
    if (!result) {
      this.logger.log('refreshing session by visiting jobs domain');
      await this.visitJobsDomain();
    }
  }

  public async fetch(props: {
    url: string;
    headers?: Record<string, string>;
    body?: any;
    access_token?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; // Optional: infer from body if missing
    referer?: string;
    timeout?: number;
  }) {
    const { url, headers: customHeaders = {}, body, access_token, method, referer, timeout } = props;
    const cookieString = await this.getCookieString(url)!;
    // 1. Construct Default Headers
    const headers = {
      Accept: this.accept,
      'Accept-Language': this.acceptLanguage,
      'User-Agent': this.userAgent,
      'x-access-token': access_token || this.access_token, // Custom auth header
      Cookie: cookieString,
      Referer: referer,
      ...customHeaders, // Allow specific overrides
    };

    const requestMethod = method || (body ? 'POST' : 'GET');

    try {
      // console.log(`fetching ${requestMethod} url:${url} ....\ncookies:${cookieString}`);
      this.logger.log(`fetching\t[${requestMethod}] url:${url}\ttimeout: ${timeout || 0}`);
      const response = await this.http.axiosRef.request({
        url,
        method: requestMethod,
        headers,
        data: body,
      });
      const { data, headers: respHeaders, status } = response;
      const contentType = response.headers['content-type'];

      const setCookie = respHeaders['set-cookie'];

      await this.updateCookieJarWithCookieStrings(setCookie, url);
      if (timeout) {
        await sleep(timeout);
      }
      return { data, setCookie, contentType, headers: respHeaders, status };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(error.response)
        this.logger.error(`Fetch error [${requestMethod} ${url}]: ${error.message}`);
      } else {
        this.logger.error(`Fetch error [${requestMethod} ${url}]: ${error}`);
      }
      // throw error;
      return error.response;
    }
  }
  private async checkIfReeseValid() {
    //if valid resent prev reese token to submit path as a text without sensor
    //if isnt valid sent with reese sensor as old_token prop
    //
    if (!this.reese84) {
      return { result: false, remains: 0 };
    }
    // const { creation } = this.reese84 as { creation: Date };
    const now = new Date();
    const resp = await this.bypassRepo.getCookieCreationTimeStampByValue(this.reese84.value);
    if (!resp) {
      return { result: false, remains: 0 };
    }
    const { creation } = resp;

    const remains = Number(this.reese84.maxAge!) - Math.abs((now.getTime() - creation.getTime()) / 1000);
    this.logger.log(`Number(this.reese84.maxAge!) - Math.abs((now.getTime() - creation.getTime()) / 1000) = ${remains}`);
    const result = remains > 0;
    return { result, remains };
  }
  private async handleReeseSensor(props: { reeseUrl: string; rootUrl: string; hyperSdkSession: HyperSdkSession }) {
    const { reeseUrl, rootUrl, hyperSdkSession } = props;
    const { data: reeseScript, contentType: reeseContentType } = await this.fetch({
      url: reeseUrl,
      referer: rootUrl,
    });

    // this.logger.log({
    //   message: '[STATIC REESE] fetched',
    //   scriptPreview: staticReeseScript.slice(0, 100),
    //   // dynamicReeseScript,
    //   contentType: staticReeseContentType,
    //   hasStaticReese,
    //   staticReeseSubmitPath,
    // });

    // //hypersdk
    const reeseInput = new Reese84Input(this.userAgent, this.ip, this.acceptLanguage, rootUrl, reeseScript, reeseUrl);
    // this.logger.log({ reeseInput });
    const reeseSensor = await generateReese84Sensor(hyperSdkSession, reeseInput);
    this.sdkUsage++;
    return reeseSensor;
  }
  private async submitReeseSensor(props: { reeeseSensorSubmitionUrl: string; reeseSensor?: any }) {
    const { reeeseSensorSubmitionUrl, reeseSensor } = props;
    const { result: isCurrentReeseValid } = await this.checkIfReeseValid();
    let body: string = String(reeseSensor);
    // if (isCurrentReeseValid) {
    //   body = this.reese84.value as string;
    // } else {
    //   if (this.reese84) {
    //     const sensor = JSON.parse(reeseSensor);
    //     sensor.old_token = this.reese84.value;
    //     for (const key in sensor) {
    //       if (!Object.hasOwn(sensor, key)) continue;

    //       this.logger.log(`body key: ${key} value: ${JSON.stringify(sensor[key]).slice(0, 100)}`);
    //     }
    //     body = JSON.stringify(sensor);
    //   }
    // }
    const { data: reeseToken } = (await this.fetch({ url: reeeseSensorSubmitionUrl, body, method: 'POST' })) as { data: reese84Token };
    // this.logger.log({ message: 'dubizzle response', reeseToken });
    await this.setReese84Cookie(reeseToken);
  }
  async handleDynamicReese(props: { rootUrl: string; indexHtml: string; ip: string; hyperSdkSession: HyperSdkSession }) {
    const { rootUrl, indexHtml, ip, hyperSdkSession } = props;
    const rootUrlObj = new URL(rootUrl);

    const domain = rootUrlObj.host;
    const protocol = rootUrlObj.protocol;
    //DYNAMIC REESE84
    const dynamicReeseScriptPaths = parseDynamicReeseScript(indexHtml, rootUrl);
    // get reese84 sensor script
    const dynamicReeseUrl = protocol + '//' + domain + dynamicReeseScriptPaths.scriptPath;
    const dynamicReeseSensor = await this.handleReeseSensor({ reeseUrl: dynamicReeseUrl, rootUrl, hyperSdkSession });

    this.logger.log({
      message: 'reese sensor solved',
      // sensor: dynamicReeseSensor.slice(0, 100)
    });

    //send the soved captcha to dubizzle back

    const reeeseSensorUrl = protocol + '//' + domain + dynamicReeseScriptPaths.sensorPath;

    await this.submitReeseSensor({ reeeseSensorSubmitionUrl: reeeseSensorUrl, reeseSensor: dynamicReeseSensor });
  }

  getStaticReeseInfo(htmlString: string, htmlUrl: string) {
    // The specific path we are looking for
    const staticReesePath = '/We-a-did-and-He-him-as-desir-call-their-Banquo-B';
    const url = new URL(htmlUrl);

    const domain = url.host;

    const staticReeseSubmitPath = `${staticReesePath}?d=${domain}`;
    // Escape the path for use in Regex (though this specific string is safe, it's good practice)
    const escapedPath = staticReesePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    /**
     * Regex Explanation:
     * <script          : Matches the start of the script tag
     * (?=.*src=...)    : Positive Lookahead 1 - Ensures 'src' matches our target path (anywhere in the tag)
     * Matches both ' and " quotes.
     * (?=.*async)      : Positive Lookahead 2 - Ensures 'async' attribute exists (anywhere in the tag)
     * [^>]* : Matches the content of the tag until the closing bracket
     * >                : Matches the closing bracket
     * /i               : Case insensitive flag
     */
    const regex = new RegExp(`<script(?=[^>]*src=['"]${escapedPath}['"])(?=[^>]*\\basync\\b)[^>]*>`, 'i');
    const hasStaticReese = regex.test(htmlString);
    return { hasStaticReese, staticReesePath, staticReeseSubmitPath };
  }
  private async bypassIncapsula(props: { rootUrl: string }) {
    this.logger.log('[START] scrapping...');
    const { rootUrl } = props;
    //find latest session

    const rootUrlObj = new URL(rootUrl);

    const domain = rootUrlObj.host;
    const protocol = rootUrlObj.protocol;

    this.logger.log({
      message: 'bypass config',
      email: this.email,
    });

    //1 GET INDEX.HTML
    let { data: indexHtml } = await this.fetch({ url: rootUrl });
    // this.logger.log({ indexHtml: indexHtml.slice(0, 500) });

    let ifDynamicReesePresent: boolean = false;
    try {
      ifDynamicReesePresent = !!parseDynamicReeseScript(indexHtml, rootUrl);
    } catch (e) {
      this.logger.log('didnt return an interaption page');
    }

    const hyperSdkSession = new HyperSdkSession(this.config.getOrThrow<string>('HYPER_SDK_API_KEY'));

    if (ifDynamicReesePresent) {
      await this.handleDynamicReese({ rootUrl, ip: this.ip, hyperSdkSession, indexHtml });

      const { data } = await this.fetch({ url: rootUrl });

      indexHtml = data;
    }

    //cookies
    const hyperCookies = await this.getHyperCookies(rootUrl);

    //sesion ids
    const hyperSdkSessionIds = getSessionIds(hyperCookies);

    //STATIC REESE84
    const { hasStaticReese, staticReesePath, staticReeseSubmitPath } = this.getStaticReeseInfo(indexHtml, rootUrl);
    const staticReeseUrl = protocol + '//' + domain + staticReesePath;

    const reeseSensor = await this.handleReeseSensor({ reeseUrl: staticReeseUrl, hyperSdkSession, rootUrl });
    const staticReeseSubmitUrl = protocol + '//' + domain + staticReeseSubmitPath;

    // UTMVC
    const utmvcScriptPath = parseUtmvcScriptPath(indexHtml);
    if (utmvcScriptPath) {
      const utmvcSubmitPath = generateUtmvcScriptPath();

      const utmvcSubmitUrl = protocol + '//' + domain + utmvcSubmitPath;
      const utmvcScriptUrl = protocol + '//' + domain + utmvcScriptPath;

      const { data: utmvcScript, contentType: utmvcScriptContentType } = await this.fetch({ url: utmvcScriptUrl, referer: rootUrl });

      // this.logger.log({ message: `[UTMVC SCRIPT]`, utmvcScriptUrl, utmvcScript: utmvcScript.slice(0, 100), utmvcScriptContentType, utmvcSubmitPath });

      // //hypersdk
      const utmvcInput = new UtmvcInput(this.userAgent, utmvcScript, hyperSdkSessionIds);

      const { payload: utmvcCookie, swhanedl } = await generateUtmvcCookie(hyperSdkSession, utmvcInput);
      this.sdkUsage++;

      this.logger.log({
        message: `[UTMVC SCRIPT] generated [v]`,
        // utmvcCookie: utmvcCookie,
        //  swhanedl
      });
      await this.setUtmvcCookie(utmvcCookie);

      //submit utmvc token
      //could return CAPTCHA
      const {
        data: utmvcSubmitResponse,
        contentType: utmvcSubmitContentType,
        setCookie: utmvcSubmitSetCookie,
      } = await this.fetch({ url: utmvcSubmitUrl, referer: rootUrl });

      this.logger.log({
        message: `[UTMVC TOKEN] submited [v]`,
        //  utmvcSubmitResponse,
        //   utmvcSubmitContentType,
        //   utmvcSubmitSetCookie
      });
    }

    //cookies
    // this.logger.log(await this.cookieJar.getCookies(rootUrl));
    await this.submitReeseSensor({ reeeseSensorSubmitionUrl: staticReeseSubmitUrl, reeseSensor });
    return;
  }
  private async sendAuthRequest(props: { email: string; password: string } | null) {
    let resp: any;
    const authEndpointUrl = 'https://uae.dubizzle.com/auth/login/v6/';
    if (props) {
      const { email, password } = props;

      const formData = new FormData();

      formData.set('username', email);
      formData.set('password', password);

      // this.logger.log({ message: 'auth request', authEndpointUrl, formData });

      resp = await this.fetch({ url: authEndpointUrl, body: formData });
    } else {
      resp = await this.fetch({ url: authEndpointUrl, method: 'POST', body: null });
    }
    const { status, data: authResp } = resp;

    if (status != 412 && status >= 300) {
      throw new Error(`unknown magic link error ${JSON.stringify(authResp)}`);
    }
    return authResp;
  }
  // to decorate
  async requestMagicLink() {
    const rootUrl = 'https://uae.dubizzle.com/en/user/auth/';

    await this.bypassIncapsula({ rootUrl });
    await sleep(10);

    const authResp = await this.sendAuthRequest({ email: this.email, password: this.password });

    const { dbz_ref_id } = authResp as { dbz_ref_id: string };

    await sleep(5);
    const emptyTokens = (await this.sendAuthRequest(null)) as { access_token: string; refresh_token: string };

    this.access_token = emptyTokens.access_token;
    this.refresh_token = emptyTokens.refresh_token;

    // this.logger.log({ emptyTokens, authResp });

    // await this.requestMagicLink({ dbz_ref_id });

    const getMagicLinkEndpointUrl = 'https://uae.dubizzle.com/auth/request_email_magic_link/';
    await this.fetch({ url: getMagicLinkEndpointUrl, body: { dbz_ref_id }, access_token: this.access_token });
    this.logger.log(`[MAGIC LINK] requested`);
    await this.saveModuleState();

    return;
  }
  // to decorate
  async processMagicLink(magicLink: string) {
    this.logger.log(magicLink);
    const url = new URL(magicLink);
    const [token] = url.pathname
      .split('/')
      .filter((s) => s)
      .reverse();

    this.logger.log(token);

    const verificationReferer = `https://uae.dubizzle.com/?token=${token}`;

    await this.bypassIncapsula({ rootUrl: magicLink });

    const { data: resp } = await this.fetch({
      url: 'https://uae.dubizzle.com/auth/verify_email_magic_link/',
      body: { magic_link_url_id: token },
      referer: verificationReferer,
    });
    const { access_token, refresh_token, otp_verification_failed } = resp as unknown as {
      access_token: string;
      refresh_token: string;
      otp_verification_failed: boolean;
    };

    this.access_token = access_token;
    this.refresh_token = refresh_token;

    this.logger.log(resp);
    await this.saveModuleState();
  }
  // to decorate
  async visitJobsDomain(forceLoadSession?: boolean) {
    const rootUrl = 'https://jobs.dubizzle.com/';
    if (!forceLoadSession) {
      await this.loadLatestModuleState();
    }

    // this.logger.log(await this.getCookieString(rootUrl));
    await this.bypassIncapsula({ rootUrl });

    const tokens = (await this.sendAuthRequest(null)) as { access_token: string; refresh_token: string };

    this.access_token = tokens.access_token;
    this.refresh_token = tokens.refresh_token;

    this.logger.log({ tokens });
    await this.saveModuleState();

    sleep(5);
  }

  //to decorate
  async scrap() {}
  /**
   * Helper: Stores an array of Set-Cookie strings into the jar.
   * tough-cookie validates the domain, so we must provide the 'currentUrl'.
   */
  private async updateCookieJarWithCookieStrings(setCookies: string[] | undefined, currentUrl: string) {
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
  private async updateCookieJarWithCookieArray(cookies: Cookie[]) {
    for (const cookie of cookies) {
      const cleanDomain = cookie.domain!.startsWith('.') ? cookie.domain!.substring(1) : cookie.domain;

      const url = `https://${cleanDomain}${cookie.path}`;
      try {
        await this.cookieJar.setCookie(cookie, url);
      } catch (err) {
        this.logger.warn(`Failed to import cookie ${cookie.key}: ${err.message}`);
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

  /**
   * Sets the 'reese84' cookie from the provided JSON token object.
   */
  public async setReese84Cookie(tokenData: reese84Token | Cookie) {
    let cookie: Cookie;
    let contextUrl: string;
    if (tokenData instanceof Cookie) {
      cookie = tokenData;
      const cookieDomain = tokenData.domain!;
      const normalizedDomain = cookieDomain.startsWith('.') ? cookieDomain.substring(1) : cookieDomain;
      contextUrl = `https://${normalizedDomain}/`;
    } else {
      const { token, renewInSec, cookieDomain } = tokenData;

      cookie = new Cookie({
        key: 'reese84',
        value: token,
        domain: cookieDomain,
        path: '/',
        maxAge: renewInSec,
        secure: true,
        httpOnly: true,
      });

      const normalizedDomain = cookieDomain.startsWith('.') ? cookieDomain.substring(1) : cookieDomain;
      contextUrl = `https://${normalizedDomain}/`;
    }
    // 3. Store it in the jar
    this.reese84 = cookie;
    try {
      await this.cookieJar.setCookie(cookie, contextUrl);
      this.logger.log(`Successfully set reese84 cookie for ${cookie.domain}`);
    } catch (error) {
      this.logger.error(`Failed to set reese84 cookie: ${error.message}`);
    }
  }
  private async setUtmvcCookie(utmvcCookie: string) {
    const cookieDomain = '.dubizzle.com';
    const normalizedDomain = cookieDomain.substring(1);
    const contextUrl = `https://${normalizedDomain}/`;
    const cookie = new Cookie({
      key: '___utmvc',
      value: utmvcCookie,
      domain: normalizedDomain,
      path: '/',
      secure: true, // Usually required for these security tokens
      httpOnly: true, // Best practice
    });
    try {
      await this.cookieJar.setCookie(cookie, contextUrl);
      this.logger.log(`Successfully set utmvc cookie for ${cookieDomain}`);
    } catch (error) {
      this.logger.error(`Failed to set utmvc cookie: ${error.message}`);
    }
  }
  onModuleDestroy() {
    this.logger.log(`[DESTROYING]....`);
  }
  async getModuleCurrentState(): Promise<DubizzleServiceState> {
    //mock
    // await this.setReese84Cookie({ token: 'asjdlkqjwieoj1829u39u', cookieDomain: 'uae.dubizzle.com', renewInSec: 123 });
    // await this.setReese84Cookie({ token: '2380293u998', cookieDomain: '.dubizzle.com', renewInSec: 123 });

    //
    const { cookies } = this.cookieJar.toJSON() as unknown as { cookies: Cookie[] };
    // this.logger.log(cookies[0].toString());
    const localStorage = { access_token: this.access_token ?? null, refresh_token: this.refresh_token ?? null };
    return { cookies, localStorage } as DubizzleServiceState;
  }
  async saveModuleState() {
    const { cookies, localStorage } = await this.getModuleCurrentState();

    const session = await this.bypassRepo.saveSession({
      publicIp: this.ip,
      sdkUsage: this.sdkUsage,
      accessToken: localStorage.access_token,
      refreshToken: localStorage.refresh_token,
      userEmail: this.email,
    });
    const { id: sessionId } = session;

    await this.bypassRepo.saveCookiesBulk(sessionId, cookies);
    this.logger.log('module state saved');
  }
  async setModuleState(props: DubizzleServiceState) {
    const { cookies, localStorage } = props;

    const { access_token, refresh_token } = localStorage;
    this.access_token = access_token;
    this.refresh_token = refresh_token;
    this.sdkUsage = 0;

    this.cookieJar = new CookieJar();
    await this.updateCookieJarWithCookieArray(cookies);
    if (cookies.some((cookie) => cookie.key === 'reese84')) {
      const [reese84] = cookies
        .filter((cookie) => cookie.key === 'reese84')
        .sort((a, b) => (b.creation as Date).getTime() - (a.creation as Date).getTime());
      await this.setReese84Cookie(reese84);
    }
  }
  async loadLatestModuleState() {
    // const session = await this.bypassRepo.getLatestSession();

    const session = await this.bypassRepo.getLatestSessionByIpAndEmail({ ip: this.ip, email: this.email });

    if (!session) {
      return { success: false };
    }

    const cookies = session?.cookies.map((rawCookie): Cookie => {
      const { key, value, domain, path, maxAge, secure, httpOnly, creation } = rawCookie;
      // this.logger.log(`key:${key} creation:${creation.toISOString()}`);
      const cookie = new Cookie({
        key,
        value,
        domain,
        path,
        maxAge,
        secure,
        httpOnly,
        creation: new Date(creation.toISOString()),
      });

      if (creation) {
        cookie.creation = new Date(creation);
      }
      // this.logger.log(cookie);
      return cookie;
    })!;

    await this.setModuleState({ cookies, localStorage: { access_token: session?.accessToken!, refresh_token: session?.refreshToken! } });
    return { success: true };
  }
}
