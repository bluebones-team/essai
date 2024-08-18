import { defineComponent, ref } from 'vue';
import { VMain } from 'vuetify/components/VMain';
import { Calendar } from '~/components/calendar';
import { client } from '~/ts/client';

const userSchedule = ref<Project['joined']['Schedule'][]>([]);
function getUserSchedule() {
  return new client('sched/joined/all', null).send({
    0(res) {
      userSchedule.value = res.data;
    },
  });
}
const ownProjectSchedule = ref<Project['own']['Schedule'][]>([]);
function getAllOwnProjectSchedule() {
  return new client('sched/own/all', null).send({
    0(res) {
      ownProjectSchedule.value = res.data;
    },
  });
}
const selectedEvent = ref<
  Project['joined']['Schedule'] | Project['own']['Schedule']
>();

export default defineComponent({
  name: 'Calendar',
  beforeRouteEnter(to, from, next) {
    Promise.allSettled([getUserSchedule(), getAllOwnProjectSchedule()]).finally(
      next,
    );
  },
  setup() {
    return () => (
      <VMain class="d-flex">
        <Calendar
          class="flex-grow-1"
          joined={userSchedule.value}
          own={ownProjectSchedule.value}
          onClick:event={(e) => {
            console.log(e);

            selectedEvent.value = e;
          }}
        />
        {selectedEvent.value ? (
          <textarea class="center">
            {JSON.stringify(selectedEvent.value, null, 4)}
          </textarea>
        ) : (
          <div class="center text-h2">请选择日程</div>
        )}
      </VMain>
    );
  },
});
