import { mdiArrowLeft, mdiEmailMultipleOutline } from '@mdi/js';
import { flatMap, groupBy } from 'lodash-es';
import { MessageType } from 'shared/enum';
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
import { client } from '~/ts//client';
import { dateFormat } from '~/ts/date';
import { usePopup } from '~/ts/hook';
import { messages, setting } from '~/ts/state';
import { toComputed } from '~/ts/util';

const totalEnum = -1;
const state = reactive({
  type: ref<
    typeof totalEnum extends MessageType
      ? "totalEnum can't be MessageType"
      : MessageType | typeof totalEnum
  >(totalEnum),
  groups: computed(() =>
    Object.entries(
      Object.groupBy(
        messages.value
          .map((e) =>
            Object.assign(e, {
              timeStr: dateFormat(e.t, 'YYYY/MM/DD hh:mm').split(' '),
            }),
          )
          .toSorted((a, b) => b.t - a.t),
        (item) => item.timeStr[0],
      ),
    ).flatMap(([date, items]) => [
      { Comp: VListSubheader, show: true, props: { title: date } },
      ...(items ?? []).map((item) => ({
        Comp: _Item,
        show: () => state.type === totalEnum || state.type === item.type,
        props: {
          value: item,
          class: 'bg-surface',
          title: item.title,
          appendText: item.timeStr[1],
          prependIcon: MessageType[item.type].icon,
          border: true,
          variant: item.has_read ? 'plain' : 'tonal',
        } satisfies Props<typeof _Item>,
      })),
    ]),
  ),
  message: ref<Shared.Message>(),
});
const detail_dialog = usePopup(Dialog, () => ({ content: _Detail }));
watchEffect(() => {
  if (state.message) detail_dialog.show();
});

function _Item(p: Props<VListItem> & { appendText?: string }) {
  return <VListItem {...p} v-slots={{ append: () => p.appendText }} />;
}
function _Detail() {
  const { mobile } = useDisplay();
  return state.message ? (
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
}

export default defineComponent(
  function () {
    const { mobile } = useDisplay();
    const showNav = ref(!mobile.value);
    // 自动已读
    let timer = null as null | number;
    watchEffect(() => {
      const msg = state.message;
      if (!msg) return;
      if (typeof timer === 'number') window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (mobile.value && !detail_dialog.isShow.value) return;
        new client('notify/read', { uid: msg.uid, mid: msg.mid }).send({
          0() {
            msg.has_read = true;
            timer = null;
          },
        });
      }, setting.notify.readDelay * 1e3);
    });
    // 自动关闭 Nav
    watchEffect(() => {
      state.type;
      if (mobile.value) showNav.value = false;
    });
    return () => (
      <div class="v-main">
        {mobile.value && (
          <VAppBar
            title={
              state.type === totalEnum
                ? '所有消息'
                : MessageType[state.type].title
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
        )}
        <VNavigationDrawer v-model={showNav.value}>
          <List
            v-model={state.type}
            type="nav"
            items={[
              {
                title: '所有消息',
                value: totalEnum,
                prependIcon: mdiEmailMultipleOutline,
              },
              ...flatMap(
                groupBy(MessageType._items, (e) => e.group),
                (items, name) => [
                  { type: 'subheader', name },
                  ...items.map(({ title, _value, icon }) => ({
                    title,
                    value: _value,
                    prependIcon: icon,
                  })),
                ],
              ),
            ]}
            itemProps
          />
        </VNavigationDrawer>
        <VMain class="h-100 d-grid grid-col-auto">
          <List v-model={state.message} lines="two">
            <VScrollYReverseTransition group hideOnLeave>
              {state.groups.map(({ Comp, props, show }, i) => (
                <Comp
                  v-show={toComputed(show).value}
                  key={props.title}
                  {...props}
                />
              ))}
            </VScrollYReverseTransition>
          </List>
          {mobile.value ? <detail_dialog.Comp /> : <_Detail />}
        </VMain>
      </div>
    );
  },
  { name: 'Message' },
);
