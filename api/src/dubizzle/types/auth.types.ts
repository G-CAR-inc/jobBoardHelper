export interface reese84Token {
  token: string;
  renewInSec: number;
  cookieDomain: string;
  rerun?: boolean;
}
export interface SessionDto {
  ip: string;
  domain: string;
  userAgent: string;
  acceptLanguage: string;
  accept: string;
}
