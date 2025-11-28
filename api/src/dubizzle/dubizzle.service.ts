import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
// Import CookieJar from tough-cookie
import { CookieJar } from 'tough-cookie';
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

  private cookieJar = new CookieJar();
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
    const {
      data: {
        versions: [agent],
      },
    } = await this.getUserAgents();

    this.urlToParse = urlToParse!;
    this.userAgent = userAgent!;
    // this.userAgent = agent.name;
    this.reeseResourcePath = reeseResourcePath!;
    this.jobsDomain = jobsDomain!;
    this.uaeDomain = uaeDomain!;
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
  async bypassIncapsula() {
    this.logger.log('[START] scrapping...');

    const rootUrl = 'https://uae.dubizzle.com';
    const acceptLanguage = 'en-US,en;q=0.9';
    const { ip } = await getPublicIp();

    const authUrl = 'https://uae.dubizzle.com/en/user/auth/';
    //1 GET INDEX.HTML
    // const { data: indexHtml, setCookie:indexHtmlSetCookies } = await this.fetch({ url: 'https://uae.dubizzle.com/en/user/auth/' });
    const resp = {
      html: `<!DOCTYPE html>\r\n<html>\r\n    <head>\r\n        <noscript>\r\n            <title>Pardon Our Interruption</title>\r\n        </noscript>\r\n\r\n        <meta name="viewport" content="width=1000">\r\n        <meta name="robots" content="noindex, nofollow">\r\n        <meta http-equiv="cache-control" content="no-cache, no-store, must-revalidate">\r\n        <meta http-equiv="pragma" content="no-cache">\r\n        <meta http-equiv="expires" content="0">\r\n\r\n        <style>\r\n            .container { max-width: 800px; margin: auto; font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; color: #7a838c; }\r\n            h1 { color: #2a2d30; font-weight: 500; }\r\n            li { margin: 0 0 10px; }\r\n            a { color: #428bca; }\r\n            a:hover, a:focus { color: #2a6496; }\r\n        </style>\r\n\r\n        <script>\r\n          var isSpa = new URLSearchParams(window.location.search).get('X-SPA') === '1' || window.isImpervaSpaSupport;\r\n        </script>\r\n\r\n        <!-- This head template should be placed before the following script tag that loads the challenge script -->\r\n        <script>\r\n          window.onProtectionInitialized = function(protection) {\r\n            if (protection && protection.cookieIsSet && !protection.cookieIsSet()) {\r\n              showBlockPage();\r\n              return;\r\n            }\r\n            if (!isSpa) {\r\n              window.location.reload(true);\r\n            }\r\n          };\r\n          window.reeseSkipExpirationCheck = true;\r\n        </script>\r\n\r\n        <script>\r\n          if (!isSpa) {\r\n            var scriptElement = document.createElement('script');\r\n            scriptElement.type = "text/javascript";\r\n            scriptElement.src = "/Spurre-Onell-vp-Enter-feed-ere-Yourthe-away-riso/1990034807062188477?s=scO3fxb4";\r\n           
 scriptElement.async = true;\r\n            scriptElement.defer = true;\r\n            document.head.appendChild(scriptElement);\r\n          }\r\n        </script>\r\n        \r\n    </head>\r\n    <body>\r\n\r\n        \r\n\r\n        <div class="container">\r\n            <script>document.getElementsByClassName("container")[0].style.display = "none";</script>\r\n            \r\n            <h1>Pardon Our Interruption</h1>\r\n<p>As you were browsing something about your browser made us think you were a bot. There are a few reasons this might happen:</p>\r\n<ul>\r\n<noscript><li>You've disabled JavaScript in your web browser.</li></noscript>\r\n<li>You're a power user moving through this website with super-human speed.</li>\r\n<li>You've disabled cookies in your web browser.</li>\r\n<li>A third-party browser plugin, such as Ghostery or NoScript, is preventing JavaScript from running. Additional information is available in this <a title='Third party browser plugins that block javascript' href='http://ds.tl/help-third-party-plugins' target='_blank'>support article</a>.</li>\r\n</ul>\r\n<p>To regain access, please make sure that cookies and JavaScript are enabled before reloading the page.</p>\r\n\r\n\r\n        </div>\r\n\t\r\n        <div id="interstitial-inprogress" style="display: none">\r\n          <style>\n    #interstitial-inprogress {\n      width:100%;\n      height:100%;\n      position:absolute;\n      top: 0;\n      left: 0;\n      bottom: 0;\n      right: 0;\n      z-index:9999;\n      background:white url("/_Incapsula_Resource?NWFURVBO=images/error_pages/bg.png") no-repeat center;\n    }\n    #interstitial-inprogress-box{\n      font-size:32px;\n      box-shadow:0 4px 14px 0 #0000001A,0 8px 24px 0 #00000021;\n      font-family:Inter,Helvetica,Arial,sans-serif;\n      position:absolute;\n      left:50%;\n      top:50%;\n      transform:translate(-50%,-50%);\n      background-color:white;\n      text-align:center;\n      width:auto;\n      min-width:min(95%,640px);\n      max-width:max-content;\n      padding:16px;\n    }\n    #interstitial-inprogress-box h3{\n      font-size:48px;\n    }\n  </style>\n  <div id="interstitial-inprogress-box">\n    <h3>Please stand by</h3>\n    <p>We&apos;re getting everything ready for you. The page is loading, and you&apos;ll be on your way in just a few moments.</p>\n    <p>Thanks for your patience!</p>\n  </div>\n\r\n        </div>\r\n\r\n        <script>\r\n          function showBlockPage() {\r\n            document.title = "Pardon Our Interruption";\r\n            document.getElementsByClassName("container")[0].style.display = "block";\r\n          }\r\n\r\n          if (isSpa) {\r\n            showBlockPage();\r\n          } else {\r\n            window.interstitialTimeout = setTimeout(showBlockPage, 10000);\r\n          }\r\n        </script>\r\n    </body>\r\n</html>\r\n`,
      setCookie: [
        'visid_incap_2413658=ske/XAnEQ3qMngEw/t2IHXVWKWkAAAAAQUIPAAAAAADNkzPfAcB+D33YbUCrTcVy; expires=Fri, 27 Nov 2026 22:20:11 GMT; HttpOnly; path=/; Domain=.dubizzle.com; Secure; SameSite=None',
        'incap_ses_786_2413658=kXbMfGlOsF5ticSI/W7oCnVWKWkAAAAABwiGLarsjEOM/zHVfRUCqg==; path=/; Domain=.dubizzle.com; Secure; SameSite=None',
      ],
    };
    const { html: indexHtml, setCookie: indexHtmlSetCookies } = resp;

    await this.updateCookieJar(indexHtmlSetCookies, authUrl);
    // UTMVC
    const resourcePath = parseUtmvcScriptPath(indexHtml);
    const submitPath = generateUtmvcScriptPath();

    //DYNAMIC REESE84
    const dynamicScript = parseDynamicReeseScript(indexHtml, rootUrl);

    //cookies
    const hyperCookies = await this.getHyperCookies(rootUrl);
    const cookieString = await this.getCookieString(rootUrl);

    //sesion ids
    const sessionIds = getSessionIds(hyperCookies);
    this.logger.log({
      message: 'State before dynamic script fetch',
      ip,
      userAgent: this.userAgent,
      cookieString,
      sessionIds,
      resourcePath,
      dynamicScript,
      submitPath,
    });

    // Generate the Payload
    const dynamicReeseUrl = rootUrl + dynamicScript.scriptPath;
    const { data: dynamicReeseScript, setCookie: dynamicReeseSetCookie } = await this.fetch({
      url: dynamicReeseUrl,
    });
    this.updateCookieJar(dynamicReeseSetCookie, dynamicReeseUrl);
    this.logger.log({
      message: 'Dynamic script fetched',
      scriptPreview: dynamicReeseScript.slice(0, 100),
      newCookies: dynamicReeseSetCookie,
    });
    this.logger.log(this.cookieJar);
    const reeseInput = new Reese84Input(this.userAgent, ip, acceptLanguage, authUrl, dynamicReeseScript, dynamicReeseUrl);
    const session = new Session(this.configService.getOrThrow<string>('HYPER_SDK_API_KEY'));
    const sensor = await generateReese84Sensor(session, reeseInput);
    this.logger.log({ sensor });

    return;
    this.logger.log(`[PARSING]`, { html: indexHtml.slice(0, 100), cookies });

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
      this.logger.log(`fetching ${requestMethod} url:${url} ....\ncookies:${cookieString}`);
      const response = await this.httpService.axiosRef.request({
        url,
        method: requestMethod,
        headers,
        data: body,
      });
      const { data, headers: respHeaders } = response;
      const setCookie = respHeaders['set-cookie'];

      return { data, setCookie };
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
