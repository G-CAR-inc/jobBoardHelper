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
  sdkUsage: number;
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

// jwt verification

export interface CustomTokenFlags {
  logged_in: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_property_agent: boolean;
  is_property_b2c_agent: boolean;
  is_landlord: boolean;
  is_motors_agent: boolean;
  is_jobs_agent: boolean;
  is_lead_block: boolean;
  is_lead_soft_block: boolean;
  is_chat_block: boolean;
  is_chat_soft_block: boolean;
  has_call_tracking: boolean;
  can_report: boolean;
  hide_public_profile: boolean;
  is_motors_agent_employee_user: boolean;
  is_rental_cars_agent: boolean;
}

export interface CustomTokenUserData {
  user_id: number;
  gender: string | null;
  nationality: string | null;
  education: string | null;
  role: string | null;
  dob: string | null;
  age: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  verification_status: string;
  verification_start_date: string;
  dealer_app_active_user_type: string | null;
}

export interface CustomTokenDeviceInfo {
  device_id: string;
  is_device_verified: boolean;
}

/**
 * Interface representing the full structure of the custom JWT payload.
 */
export interface CustomTokenPayload {
  id: string;
  iss: string;
  aud: string[];
  sub: string;
  /** Expiration time as a Unix timestamp (seconds since epoch). */
  exp: number;
  /** Issued at time as a Unix timestamp (seconds since epoch). */
  iat: number;
  jti: string;
  typ: string;
  flags: CustomTokenFlags;
  user_data: CustomTokenUserData;
  business_data: Record<string, unknown>; // Use Record<string, unknown> for flexible object type
  device_info: CustomTokenDeviceInfo;
}

/**
 * Defines the structured result of the token verification process.
 */
export interface TokenVerificationResult {
  isValid: boolean;
  errors: string[];
}
