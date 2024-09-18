import { each, pick } from 'shared';
import { Role, Theme } from 'shared/data';
import { reactive, ref, type InjectionKey } from 'vue';
import { VSnackbar } from 'vuetify/components/VSnackbar';
import { client } from './client';
import { usePopup } from './hook';
import { error } from './util';

/**显示加载进度条 */
export const showProgressbar = ref(false);
/**用户数据 */
export const udata = ref<User.Own>();
/**用户设置 */
export const setting = reactive({
  /**显示 */
  display: {
    /**主题 */
    theme: Theme.System._value as Theme,
    /**角色 */
    role: Role.Participant._value as Role,
  },
  /**消息通知 */
  notify: {
    /**消息已读定时 */
    readDelay: 2,
  },
  /**日程表 */
  calendar: {
    timeline: [8, 22] as [number, number],
  },
  /**隐私 */
  privacy: {
    /**允许被添加至参与者库 */
    allowAddToLib: true,
  },
  /**权限 */
  permission: {
    geolocation: true,
    notification: true,
  },
});
/**消息 */
export const messages = ref<Shared.Message[]>([]);

// 初始化
setTimeout(() => {
  new client('login/token', null).send({
    0(res) {
      udata.value = res.data;
    },
  });
  new client('notify/list', { pn: 1, ps: 20 }).send({
    0(res) {
      messages.value = res.data;
    },
  });
  new client('notify/stream', null).send({
    0(res) {
      messages.value.push(res.data);
    },
  });
});

/**LocalStorage */
export const storage = (function () {
  /**LocalStroage 数据 */
  type D = Shared.Token & { theme: Theme; role: Role };
  return {
    get<K extends keyof D>(key: K) {
      return localStorage.getItem(key) as D[K];
    },
    set<K extends keyof D>(key: K, value: D[K]) {
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
    remove<K extends keyof D>(key: K) {
      localStorage.removeItem(key);
    },
    setToken(obj: Shared.Token) {
      each(pick(obj, ['access', 'refresh']), (v, k) =>
        this.set(k as keyof D, v),
      );
    },
    removeToken() {
      this.remove('access');
      this.remove('refresh');
    },
  };
})();

// popup
export const snackbar = usePopup(
  VSnackbar,
  () =>
    ({
      text: 'Hello Brain',
      color: 'primary',
      timeout: 2e3,
      timer: '#fff8',
      location: 'top',
      key: Date.now(),
    }) as const,
);

export const injection = {
  editable: Symbol('editable') as InjectionKey<MaybeGetter<boolean>>,
};
