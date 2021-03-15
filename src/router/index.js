import Vue from 'vue'
import VueRouter from 'vue-router'
import Gotchi from '../views/Gotchi.vue'
import Portals from '../views/Portals.vue'
import ClosedPortalsBazaar from '../views/ClosedPortalsBazaar.vue'
import OpenPortals from '../views/OpenPortals.vue'
import Wearables from '../views/Wearables.vue'

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
