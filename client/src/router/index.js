import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home';
import Session from '../views/Session';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/session/:session_id',
    name: 'Session',
    component: Session
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
