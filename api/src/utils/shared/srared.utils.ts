import axios from 'axios';
import { Cookie } from './shared.types';

export const transformCookiesToCookieString = (cookies: Cookie[]): string => {
  const cookieString = cookies.map((coockie) => `${coockie.name}=${coockie.value}`).join('; ');
  return cookieString;
};
export const getPublicIp = async () => {
  /**
   * curl 'https://api.ipify.org?format=json'
   * {"ip":"79.163.204.239"}
   */
  const { data } = await axios.get('https://api.ipify.org?format=json');
  return data as { ip: string };
};
