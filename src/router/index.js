import Vue from 'vue'
import VueRouter from 'vue-router'
import Gotchi from '../views/Gotchi.vue'
import ClosedPortals from '../views/ClosedPortals.vue'
import ClosedPortalsBazaar from '../views/ClosedPortalsBazaar.vue'
import OpenPortals from '../views/OpenPortals.vue'
import Wearables from '../views/Wearables.vue'
import Consumables from '../views/Consumables.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Gotchi',
    component: Gotchi
  },
  {
    path: '/closed-portals',
    name: 'ClosedPortals',
    component: ClosedPortals
  },
  {
    path: '/closed-portals-bazaar',
    name: 'ClosedPortalsBazaar',
    component: ClosedPortalsBazaar
  },
  {
    path: '/opened-portals',
    name: 'OpenPortals',
    component: OpenPortals
  },
  {
    path: '/wearables',
    name: 'Wearables',
    component: Wearables
  },
  {
    path: '/consumables',
    name: 'Consumables',
    component: Consumables
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
