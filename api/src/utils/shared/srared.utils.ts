import { Cookie } from './shared.types';

export const transformCookiesToCookieString = (cookies: Cookie[]): string => {
  return cookies.map((coockie) => `${coockie.name}=${coockie.value}`).join('; ');
};
