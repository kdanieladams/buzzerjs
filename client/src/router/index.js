import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home';
import WaitingRoom from '../views/WaitingRoom';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/session/:sessionid/wait',
    name: 'WaitingRoom',
    component: WaitingRoom
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
