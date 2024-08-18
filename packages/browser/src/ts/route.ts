import { each } from 'lodash-es';
import { Role } from 'shared/enum';
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router';
import { setting, showProgressbar, udata } from '~/ts/state';
import { createDefaultPropertyProxy } from '~/ts/util';

const routesMap = createDefaultPropertyProxy(() => [] as RouteRecordRaw[]);
const configMap = createDefaultPropertyProxy(() => {
  let target: {}, config: {};
  const assign = () => target && config && Object.assign(target, config);
  return {
    set target(e: {}) {
      target = e;
      assign();
    },
    set config(e: {}) {
      config = e;
      assign();
    },
  };
});
const modules = import.meta.glob([
  '~/pages/**/*.(vue|ts|tsx)',
  '!~/pages/**/config.ts',
  '!~/pages/**/components/*',
]);
const configs = import.meta.glob('~/pages/**/config.ts', {
  eager: true,
  import: 'default',
});
// console.log(modules, configs);
const rootpath = '/src/pages/';
const configpath = '/config.ts';
function createRoutes() {
  each(modules, (importModule, filepath) => {
    function addRoute(
      dirpath: string,
      route: Partial<RouteRecordRaw> & { path: string },
    ) {
      route.component ??= importModule;
      route.path = route.path.toLowerCase();
      if (dirpath === '' && !route.path.startsWith('/')) {
        route.path = '/' + route.path;
      }
      //@ts-ignore
      routesMap[dirpath].push(route);
    }
    const names = filepath.replace(rootpath, '').split('/');
    const dirpath = names.slice(0, -1).join('/');
    const [filename, suffix] = names.slice(-1)[0].split('.');
    if (filename === 'index') {
      if (dirpath === '') {
        addRoute(dirpath, { path: '/' });
      } else {
        addRoute(
          names.slice(0, -2).join('/'),
          (configMap[dirpath].target = {
            path: names.slice(-2)[0],
            children: routesMap[dirpath],
          }),
        );
      }
    } else {
      addRoute(dirpath, { path: filename });
    }

    const config = configs[rootpath + dirpath + configpath];
    if (config) {
      configMap[dirpath].config = config;
    }
  });
  return routesMap[''];
}
export const routes = createRoutes();
export const router = createRouter({
  history: createWebHistory(),
  routes,
});
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
  if (role === Role.Recruiter._value && !udata.value?.auth.recruiter) {
    return { path: '/404' };
  }
  setting.display.role = role;
});
router.afterEach(() => {
  showProgressbar.value = false;
});

console.debug('routes', routes, router.getRoutes());
