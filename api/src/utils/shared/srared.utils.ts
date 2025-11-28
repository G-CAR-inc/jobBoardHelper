import { Cookie } from './shared.types';

export const transformCookiesToCookieString = (cookies: Cookie[]): string => {
  return cookies.map((coockie) => `${coockie.name}=${coockie.value}`).join('; ');
};
export const parseSetCookies = (setCookies: string[]): Cookie[] => {
  return setCookies?.map((cookieWithPayload) => {
    const [c] = cookieWithPayload.split('; ');
    const i = c.indexOf('=');
    const name = c.slice(0, i);
    const value = c.slice(i + 1);
    return { name, value } as Cookie;
  });
};
