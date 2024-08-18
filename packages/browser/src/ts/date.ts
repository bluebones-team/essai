import { each } from 'lodash-es';

export const Duration2Timestamp = (duration: Shared.Duration) => duration * 60;
export const Timestamp2Date = (timestamp: Shared.Timestamp) =>
  new Date(timestamp * 1e3);
export const Date2Timestamp = (date: Date) => Math.floor(date.getTime() * 1e-3);
/**获取年龄 */
export function Birthday2Age(birthday: Shared.Timestamp) {
  const now = new Date();
  const birth = Timestamp2Date(birthday);
  return now.getFullYear() - birth.getFullYear();
}
/**获取生日 */
export function Age2Birthday(age: number) {
  const now = new Date();
  const birth = new Date();
  birth.setFullYear(now.getFullYear() - age);
  return Date2Timestamp(birth);
}

const parse = (date: Date) => ({
  Y: date.getFullYear() + '',
  M: date.getMonth() + 1 + '',
  D: date.getDate() + '',
  h: date.getHours() + '',
  m: date.getMinutes() + '',
  s: date.getSeconds() + '',
});
/**格式化时间 */
export function dateFormat(
  date: Date | Shared.Timestamp,
  format = 'YYYY/MM/DD',
) {
  if (date === void 0) {
    console.error('dateFormat缺少参数date');
    date = new Date();
  }
  if (typeof date === 'number') {
    date = Timestamp2Date(date);
  }
  const { Y, M, D, h, m, s } = parse(date);
  const formatMap = {
    YYYY: () => Y,
    MM: () => M.padStart(2, '0'),
    DD: () => D.padStart(2, '0'),
    hh: () => h.padStart(2, '0'),
    mm: () => m.padStart(2, '0'),
    ss: () => s.padStart(2, '0'),
    M: () => M,
    D: () => D,
    h: () => h,
    m: () => m,
    s: () => s,
  };
  each(formatMap, (v, k) => {
    format = format.replace(k, v());
  });
  return format;
}
/**根据秒数，返回毫秒数 */
export const second = (num: number) => num * 1e3;
/**根据分钟数，返回毫秒数 */
export const min = (num: number) => num * second(60);
/**根据小时数，返回毫秒数 */
export const hour = (num: number) => num * min(60);
/**根据天数，返回毫秒数 */
export const day = (num: number) => num * hour(24);
