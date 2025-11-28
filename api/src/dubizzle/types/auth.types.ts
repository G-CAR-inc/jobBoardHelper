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
// api/src/dubizzle/types/auth.types.ts

// Input for creating a Session
export interface CreateSessionDto {
  publicIp: string;
  domain: string;
  userAgent: string;
  acceptLanguage: string;
  accept: string;
}

// Input for UTMVC (Manual creation time)
export interface CreateUtmvcDto {
  token: string;
  createdAt: Date; // Manual timestamp
}

// Input for Reese84 (Matches your schema map)
export interface CreateReese84Dto {
  token: string;
  renewInSec: number;
  domain: string;
  createdAt: Date; // Manual timestamp
}

// Input for Cookies (Matches your JSON structure provided earlier)
export interface CreateCookieDto {
  key: string; // name
  value: string;
  domain: string;
  path?: string;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
}
