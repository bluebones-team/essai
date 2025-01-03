import { mdiArrowLeft, mdiBellOutline, mdiEmailMultipleOutline } from '@mdi/js';
import { MessageType } from 'shared/data';
import { groupBy, map } from 'shared';
import { computed, defineComponent, reactive, ref, watchEffect } from 'vue';
import { useDisplay } from 'vuetify';
import { VAppBar, VAppBarNavIcon } from 'vuetify/components/VAppBar';
import { VBtn } from 'vuetify/components/VBtn';
import { VListItem, VListSubheader } from 'vuetify/components/VList';
import { VMain } from 'vuetify/components/VMain';
import { VNavigationDrawer } from 'vuetify/components/VNavigationDrawer';
import { VToolbar, VToolbarTitle } from 'vuetify/components/VToolbar';
import { VScrollYReverseTransition } from 'vuetify/components/transitions';
import { Dialog } from '~/components/dialog';
import { List } from '~/components/list';
import { c } from '~/ts//client';
import { dateFormat } from '~/ts/date';
import { usePopup } from '~/ts/hook';
import { messages, setting } from '~/ts/state';

const totalEnum = -1;
const state = reactive({
  type: ref<
    typeof totalEnum extends MessageType
      ? "totalEnum can't be MessageType"
      : MessageType | typeof totalEnum
  >(totalEnum),
  message: ref<Shared['message']>(),
});

const _Nav = defineComponent(() => {
  const { mobile } = useDisplay();
  const showNav = ref(!mobile.value);
  watchEffect(() => {
    state.type;
    if (mobile.value) showNav.value = false;
  });
  const navItems = [
    {
      title: '所有消息',
      value: totalEnum,
      prependIcon: mdiEmailMultipleOutline,
    },
    ...map(groupBy(MessageType.items, 'group'), (items, groupKey) => [
      { type: 'subheader', title: groupKey },
      ...items.map(({ text, value, icon }) => ({
        title: text,
        value,
        prependIcon: icon,
      })),
    ]).flat(),
  ];
  return () => [
    mobile.value && (
      <VAppBar
        title={
          state.type === totalEnum ? '所有消息' : MessageType[state.type].text
        }
        icon
        v-slots={{
          prepend: () => (
            <VAppBarNavIcon
              onClick={() => {
                showNav.value = !showNav.value;
              }}
            />
          ),
        }}
      />
    ),
    <VNavigationDrawer v-model={showNav.value}>
      <List v-model={state.type} type="nav" items={navItems} itemProps />
    </VNavigationDrawer>,
  ];
});
const _MsgList = defineComponent(() => {
  const Item = (p: Props<VListItem> & { appendText?: string }) => (
    <VListItem {...p} v-slots={{ append: () => p.appendText }} />
  );
  const groups = computed(() => {
    const msgs = messages.value
      .toSorted((a, b) => b.t - a.t)
      .map((e) => {
        const [day, time] = dateFormat(e.t, 'YYYY/MM/DD hh:mm').split(' ');
        return Object.assign(e, { day, time });
      });
    return map(
      groupBy(msgs, (item) => item.day),
      (items, day) => [
        { Comp: VListSubheader, show: { value: true }, props: { title: day } },
        ...items.map((item) => ({
          Comp: Item,
          show: computed(
            () => state.type === totalEnum || state.type === item.type,
          ),
          props: {
            value: item,
            class: 'bg-surface',
            title: item.title,
            appendText: item.time,
            prependIcon: MessageType[item.type].icon,
            border: true,
            variant: item.read ? 'plain' : 'tonal',
          } satisfies Props<typeof Item>,
        })),
      ],
    ).flat();
  });
  return () => (
    <List v-model={state.message} lines="two">
      <VScrollYReverseTransition group hideOnLeave>
        {groups.value.map(({ Comp, props, show }, i) => (
          <Comp v-show={show.value} key={props.title} {...props} />
        ))}
      </VScrollYReverseTransition>
    </List>
  );
});
const _Detail = defineComponent(() => {
  const { mobile } = useDisplay();
  // 自动已读
  let timer = null as null | number;
  watchEffect(() => {
    const msg = state.message;
    if (!msg) return;
    if (typeof timer === 'number') window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (mobile.value && !detail_dialog.isShow.value) return;
      c['/msg/read'].send(
        { uid: msg.uid, mid: msg.mid },
        {
          0() {
            msg.read = true;
            timer = null;
          },
        },
      );
    }, setting.notify.readDelay * 1e3);
  });
  return () =>
    state.message ? (
      <div>
        <VToolbar>
          {mobile.value && (
            <VBtn icon={mdiArrowLeft} onClick={detail_dialog.close} />
          )}
          <VToolbarTitle text={state.message.title} />
        </VToolbar>
        <div class="pa-6">{state.message.content}</div>
      </div>
    ) : (
      <div class="center text-h2">请选择消息</div>
    );
});

const detail_dialog = usePopup(Dialog, () => ({ content: _Detail }));
watchEffect(() => {
  if (state.message) detail_dialog.show();
});

export const route: LooseRouteRecord = {
  meta: {
    nav: {
      tip: '消息',
      icon: mdiBellOutline,
      order: 6,
    },
    need: { login: true },
  },
};
export default defineComponent(
  function () {
    const { mobile } = useDisplay();
    return () => (
      <div class="v-main">
        <_Nav />
        <VMain class="h-100 d-grid grid-col-auto">
          <_MsgList />
          {mobile.value ? <detail_dialog.Comp /> : <_Detail />}
        </VMain>
      </div>
    );
  },
  { name: 'Message' },
);
