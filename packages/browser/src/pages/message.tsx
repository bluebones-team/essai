import { mdiArrowLeft, mdiBellOutline, mdiEmailMultipleOutline } from '@mdi/js';
import { groupBy, map } from 'shared';
import { MessageType } from 'shared/data';
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
import { messages } from '~/ts/state';
import { definePageComponent } from '~/ts/util';

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
const totalEnum = -1;
const type =
  ref<
    typeof totalEnum extends MessageType
      ? "totalEnum can't be MessageType"
      : MessageType | typeof totalEnum
  >(totalEnum);
const typedText = computed(() =>
  type.value === totalEnum ? '所有消息' : MessageType[type.value].text,
);
const state = reactive({
  type,
  typedText,
  message: ref<FTables['message']>(),
});

const _Nav = defineComponent(() => {
  const { mobile } = useDisplay();
  const showNav = ref(!mobile.value);
  watchEffect(() => {
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
        title={state.typedText}
        icon
        v-slots={{
          prepend: () => (
            <VAppBarNavIcon onClick={() => (showNav.value = !showNav.value)} />
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
      .toSorted((a, b) => b.created_at - a.created_at)
      .map((e) => {
        const [day, time] = dateFormat(e.created_at, 'YYYY/MM/DD hh:mm').split(
          ' ',
        );
        return Object.assign(e, { day, time });
      });
    return map(
      groupBy(msgs, (item) => item.day),
      (items, day) => {
        const dayMsgs = items.map((item) => ({
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
            variant: item.has_read ? 'plain' : 'tonal',
          } satisfies Props<typeof Item>,
        }));
        return [
          {
            Comp: VListSubheader,
            show: computed(() => dayMsgs.some((e) => e.show.value)),
            props: { title: day },
          },
          ...dayMsgs,
        ];
      },
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
  watchEffect(() => {
    const msg = state.message;
    if (!msg || msg.has_read) return;
    c['/msg/read'].send(
      { mid: msg.mid },
      {
        0() {
          msg.has_read = true;
        },
      },
    );
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
export default definePageComponent(import.meta.url, () => {
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
});
