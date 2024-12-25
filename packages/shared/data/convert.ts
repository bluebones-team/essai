export function date_ts(...e: ConstructorParameters<DateConstructor>) {
  return Math.floor(new Date(...e).getTime() / 1e3) as Shared['timestamp'];
}
export function ts_date(ts: Shared['timestamp']) {
  return new Date(ts * 1e3);
}
export function birth_age(birthday: Shared['timestamp']) {
  const now = new Date();
  const birth = ts_date(birthday);
  return now.getFullYear() - birth.getFullYear();
}
