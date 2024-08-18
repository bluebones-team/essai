import { router } from '~/ts/route';
import { vuetify } from '~/ts/vuetify';
import { createApp } from 'vue';
import { App } from './App';
import './style/main.css';

createApp(App).use(router).use(vuetify).mount('#app');
