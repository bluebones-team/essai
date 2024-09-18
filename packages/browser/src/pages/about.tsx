import { defineComponent } from 'vue';

export const route: SupplyRoute = {};
export default defineComponent({
  name: 'About',
  setup() {
    const domain = location.hostname.match(/[a-z]+\.[a-z]+$/)?.[0];
    location.href = domain ? `https://${domain}/about` : '/';
    return () => null;
  },
});
