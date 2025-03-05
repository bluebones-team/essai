import { each, pick } from 'shared';
import { Role, Theme } from 'shared/data';
import { reactive, ref, type InjectionKey } from 'vue';
import { SnackbarQueue } from '~/components/snackbar';
import { c } from './client';
import { usePopup } from './hook';
import { error } from './util';

/**显示加载进度条 */
export const showProgressbar = ref(false);
/**用户数据 */
export const udata = ref<FTables['user']['own']>();
/**用户设置 */
export const setting = reactive({
  /**显示 */
  display: {
    /**主题 */
    theme: Theme.System.value as Theme,
    /**角色 */
    role: Role.Participant.value as Role,
  },
  // /**消息通知 */
  // notify: {
  //   /**消息已读定时 */
  //   readDelay: 2,
  // },
  // /**日程表 */
  // calendar: {
  //   timeline: [8, 22] as [number, number],
  // },
  /**权限 */
  permission: {
    geolocation: false,
    notification: false,
  },
});
/**消息 */
export const messages = ref<FTables['message'][]>([]);

// 初始化
setTimeout(() => {
  c['/login/token'].send(void 0, {
    0(res) {
      udata.value = res.data;
    },
  });
  c['/msg/ls'].send(
    { pn: 1, ps: 20 },
    {
      0(res) {
        messages.value = res.data;
      },
    },
  );
  c['/msg/stream'].send(void 0, {
    0(res) {
      messages.value.push(res.data);
    },
  });
});

/**LocalStorage */
export const storage = {
  get<K extends keyof LocalStorage>(key: K) {
    return localStorage.getItem(key) as LocalStorage[K];
  },
  set<K extends keyof LocalStorage>(key: K, value: LocalStorage[K]) {
    const convert = () => value + '';
    const handleError = () => (error('LocalStorage data error'), '');
    localStorage.setItem(
      key,
      //@ts-ignore
      {
        object: () => JSON.stringify(value),
        boolean: convert,
        bigint: convert,
        number: convert,
        string: () => value,
        symbol: handleError,
        function: handleError,
        undefined: handleError,
      }[typeof value](),
    );
  },
  remove<K extends keyof LocalStorage>(key: K) {
    localStorage.removeItem(key);
  },
  setToken(obj: Shared['token']) {
    each(pick(obj, ['access', 'refresh']), (v, k) =>
      this.set(k as keyof LocalStorage, v),
    );
  },
  removeToken() {
    this.remove('access');
    this.remove('refresh');
  },
};
export const snackbar = usePopup(SnackbarQueue);
export const injection = {
  editable: Symbol('editable') as InjectionKey<MaybeGetter<boolean>>,
};

const storeRaw = {
  setting,
  snackbar,
  messages,
  udata,
  add(name: string, value: {}) {
    store[name] = value;
  },
};
export const store = reactive<LooseObject & typeof storeRaw>(storeRaw);
Object.assign(window, { store });
