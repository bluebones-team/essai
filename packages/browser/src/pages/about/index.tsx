import { defineComponent } from 'vue';

export default defineComponent({
  name: 'About',
  setup() {
    location.href = import.meta.env.DEV
      ? '/'
      : `https://${location.host}/about`;
    return () => null;
  },
});
