//https://antoniandre.github.io/vue-cal/
import 'vue-cal/dist/vuecal.css';
import '~/style/vuecal.css';

import { date_ts, EventType, RecruitmentType, ts_date } from 'shared/data';
import { computed, defineComponent, ref, watchEffect } from 'vue';
import VueCal, { type vuecal } from 'vue-cal';
import { VBtn } from 'vuetify/components/VBtn';
import { VToolbar } from 'vuetify/components/VToolbar';
import { dateFormat } from '~/ts/date';
import { useDefaults } from '~/ts/hook';
import { setting } from '~/ts/state';
import { error } from '~/ts/util';

function Schedule2Event(
  schedule: Project['Schedule'],
  index: number,
  eventType: EventType,
) {
  const { rtype } = schedule;
  return {
    start: ts_date(schedule.start),
    end: ts_date(schedule.end),
    title: RecruitmentType[rtype].title,
    class: `event-${eventType}-${rtype}`,
    draggable: eventType !== EventType.Public.value,
    meta: {
      index,
      eventType,
      participantType: rtype,
      raw: schedule,
    },
  };
}

export const Calendar = defineComponent(function (
  props: {
    public?: Project['public']['Schedule'][];
    joined?: Project['joined']['Schedule'][];
    own?: Project['own']['Schedule'][];
    draggable?: boolean;
    activeView?: 'month' | 'week' | 'day';
    'onCreate:event'?: (start: Date) => void;
    'onClick:event'?: (
      schedule: Project['joined']['Schedule'] | Project['own']['Schedule'],
    ) => void;
  },
  { slots },
) {
  const p = useDefaults(props, {
    public: [],
    joined: [],
    own: [],
    draggable: false,
    activeView: 'month',
  });
  const { calendar } = setting;

  // 按钮
  const vuecal = ref<vuecal.Instance>();
  const activeView = ref(p.activeView);
  watchEffect(() => {
    activeView.value = p.activeView;
  });
  function Header() {
    const btns = [
      { icon: '$prev', onClick: () => vuecal.value?.previous() },
      { text: '月', onClick: () => (activeView.value = 'month') },
      { text: '周', onClick: () => (activeView.value = 'week') },
      { text: '日', onClick: () => (activeView.value = 'day') },
      { icon: '$next', onClick: () => vuecal.value?.next() },
    ];
    const Btns = btns.map((btn) => (
      <VBtn
        class={{
          'text-subtitle-1': true,
          'rounded-circle': btn.icon,
          'h-100': !btn.icon,
        }}
        size="small"
        {...btn}
      />
    ));
    return (
      <VToolbar>
        <div class="d-grid grid-cols-3 h-100 w-100 mx-3">
          <div class="d-flex align-center justify-start">
            {slots.prepend?.()}
          </div>
          <div class="d-flex align-center justify-center">{Btns}</div>
          <div class="d-flex align-center justify-end">{slots.append?.()}</div>
        </div>
      </VToolbar>
    );
  }

  // 日程表
  const timeStep = 15;
  const events = computed(() => [
    ...p.public.map((e, i) => Schedule2Event(e, i, EventType.Public.value)),
    ...p.joined.map((e, i) => Schedule2Event(e, i, EventType.Joined.value)),
    ...p.own.map((e, i) => Schedule2Event(e, i, EventType.Own.value)),
  ]);
  const vcProps = computed<vuecal.Props>(() => {
    return {
      class: 'flex-grow-1 overflow-auto',
      locale: 'zh-cn',
      disableViews: ['years', 'year'] as const,
      // selectedDate: new Date(),
      small: true,
      watchRealTime: true,
      todayButton: false,
      hideTitleBar: true,
      hideViewSelector: true,
      disableDatePrototypes: true,
      timeFrom: calendar.timeline[0] * 60,
      timeTo: calendar.timeline[1] * 60,
      timeStep,
      snapToTime: timeStep,
      timeCellHeight: (64 * timeStep) / 60,
      events: events.value,
      editableEvents: {
        drag: p.draggable,
        title: false,
        resize: false,
        delete: false,
        create: true,
      },
    };
  });
  const vcSlots: vuecal.Slots = {
    'time-cell': ({ hours, minutes }) => (
      <div class={{ 'vuecal__time-cell-line': true, hours: !minutes }}>
        {!minutes && <span>{hours}</span>}
      </div>
    ),
    'cell-content': ({ cell, view, events, goNarrower }) => (
      <>
        {view.id === 'month' && (
          <div
            title={dateFormat(cell.startDate)}
            class="vuecal__cell-date"
            onDblclick={goNarrower}
          >
            {cell.startDate.getDate()}
          </div>
        )}
        {view.id === 'month' && !!events.length && (
          <div class="vuecal__cell-events-count"></div>
        )}
        {['week', 'day'].includes(view.id) && !events.length && (
          <div class="vuecal__no-event">休息日</div>
        )}
      </>
    ),
  };
  function Content() {
    return (
      <VueCal
        ref={vuecal}
        v-model:activeView={activeView.value}
        onCellClick={(e: Date) => p['onCreate:event']?.(e)}
        onEventFocus={(e: vuecal.Event) => p['onClick:event']?.(e.meta.raw)}
        onEventDrop={(e: vuecal.EventChange) => {
          const { event } = e;
          const { meta } = event;
          ({
            [EventType.Joined.value]() {
              p.joined[meta.index].start = date_ts(event.start);
              p.joined[meta.index].end = date_ts(event.end);
            },
            [EventType.Public.value]() {
              error('公共项目日程不可拖动');
            },
            [EventType.Own.value]() {
              p.own[meta.index].start = date_ts(event.start);
              p.own[meta.index].end = date_ts(event.end);
            },
          })[meta.eventType as EventType]?.();
        }}
        {...vcProps.value}
        v-slots={vcSlots}
      />
    );
  }
  return () => (
    <div class="flex-column h-100" style="display: flex">
      <Header />
      <Content />
    </div>
  );
});
