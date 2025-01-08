import { definePageComponent } from '~/ts/util';

export const route: LooseRouteRecord = {};
export default definePageComponent(import.meta.url, () => {
  const domain = location.hostname.match(/\w+\.\w+$/)?.[0];
  location.href = domain ? `https://${domain}/about` : '/';
  return () => null;
});
