import Vue from 'vue'
import VueRouter from 'vue-router'
import Gotchi from '../views/Gotchi.vue'
import Portals from '../views/Portals.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Gotchi',
    component: Gotchi
  },
  {
    path: '/closed-portals',
    name: 'Portals',
    component: Portals
  },
  {
    path: '*',
    name: 'catchAll',
    component: Gotchi
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
