import App from '@/App.vue';
import { createSSRApp } from 'vue';

import './style.css';

// `createSSRApp` hydrates the server-rendered markup. (A client-only app would use `createApp`.)
createSSRApp(App).mount('#app');
