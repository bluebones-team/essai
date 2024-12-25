import { each } from 'shared';
import { Role } from 'shared/data';
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router';
import { setting, showProgressbar, udata } from '~/ts/state';
import { createDefaultPropertyProxy } from '~/ts/util';

const routeMap = createDefaultPropertyProxy((): RouteRecordRaw[] => []);
const modules = import.meta.glob(
  ['~/pages/**/*.tsx', '!~/pages/**/components/*'],
  {},
);
const configs = import.meta.glob(
  ['~/pages/**/*.tsx', '!~/pages/**/components/*'],
  { import: 'route', eager: true },
);
function addRoute(
  importModule: () => Promise<unknown>,
  dirpath: string,
  route: Partial<RouteRecordRaw> & { path: string },
) {
  route.component ??= importModule;
  route.path = route.path.toLowerCase();
  if (dirpath === '' && !route.path.startsWith('/')) {
    route.path = '/' + route.path;
  }
  //@ts-ignore
  routeMap[dirpath].push(route);
  return route;
}
function createRoutes() {
  each(modules, (importModule, filepath) => {
    const parts = filepath.replace('/src/pages/', '').split('/');
    const dirpath = parts.slice(0, -1).join('/');
    const [filename, _] = parts.slice(-1)[0].split('.');
    const route =
      filename === 'index'
        ? dirpath === ''
          ? addRoute(importModule, dirpath, { path: '/' })
          : addRoute(importModule, parts.slice(0, -2).join('/'), {
              path: parts.slice(-2)[0],
              children: routeMap[dirpath],
            })
        : addRoute(importModule, dirpath, { path: filename });
    Object.assign(route, configs[filepath]);
  });
  return routeMap[''];
}
const routes = createRoutes();
export const router = createRouter({ history: createWebHistory(), routes });
router.beforeEach((to, from) => {
  showProgressbar.value = true;
  const { need } = to.meta;
  if (need === void 0) {
    return true;
  }
  const { login, role } = need;
  if (login && !udata.value) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  if (role === void 0) {
    return true;
  }
  if (role === Role.Recruiter.value && !udata.value?.recruiter) {
    return { path: '/404' };
  }
  setting.display.role = role;
});
router.afterEach(() => {
  showProgressbar.value = false;
});

// console.log('routes', routes, router.getRoutes());
