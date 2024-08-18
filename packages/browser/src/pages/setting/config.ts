import type { RouteLocation, RouteRecordRaw } from 'vue-router';

export default {
  redirect: (to: RouteLocation) => {
    const [route] = to.matched;
    if (route.path !== '/setting') return '/404';
    const subRoute = route.children.find(
      (route) =>
        route.meta?.btnProps?.groupOrder === 1 &&
        route.meta?.btnProps?.order === 1
    );
    return subRoute ? route.path + '/' + subRoute.path : '/404';
  },
} as RouteRecordRaw;
