import Vue from 'vue'
import VueRouter from 'vue-router'
import Gotchi from '../views/Gotchi.vue'
import Portals from '../views/Portals.vue'
import Bazaar from '../views/Bazaar.vue'
import OpenPortals from '../views/OpenPortals.vue'

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
    path: '/bazaar',
    name: 'Bazaar',
    component: Bazaar
  },
  {
    path: '/opened-portals',
    name: 'OpenPortals',
    component: OpenPortals
  },
  {
    path: '*',
    name: 'catchAll',
    component: Gotchi
  }
]

const router = new VueRouter({
  mode: '',
  base: process.env.BASE_URL,
  routes
})

export default router
