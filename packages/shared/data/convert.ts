export function date2ts(...e: ConstructorParameters<DateConstructor>) {
  return Math.floor(new Date(...e).getTime() / 1e3) as Shared['timestamp'];
}
export function ts2date(ts: Shared['timestamp']) {
  return new Date(ts * 1e3);
}
export function birth2age(birthday: Shared['timestamp']) {
  const now = new Date();
  const birth = ts2date(birthday);
  return now.getFullYear() - birth.getFullYear();
}
