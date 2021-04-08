import { createApp } from 'vue'
import { maska } from 'maska';
import App from './App.vue'
import router from './router'

createApp(App)
    .directive('maska', maska)
    .use(router)
    .mount('#app');
