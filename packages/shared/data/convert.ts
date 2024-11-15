export function date_ts(...e: ConstructorParameters<DateConstructor>) {
  return Math.floor(new Date(...e).getTime() / 1e3) as Shared.Timestamp;
}
export function ts_date(ts: Shared.Timestamp) {
  return new Date(ts * 1e3);
}
export function birth_age(birthday: Shared.Timestamp) {
  const now = new Date();
  const birth = ts_date(birthday);
  return now.getFullYear() - birth.getFullYear();
}
