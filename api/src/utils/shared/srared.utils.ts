import { Cookie } from 'hyper-sdk-js';

export const transformCookiesToCookieString = (cookies: Cookie[]): string => {
  const cookieString = cookies.map((coockie) => `${coockie.name}=${coockie.value}`).join('; ');
  return cookieString;
};
