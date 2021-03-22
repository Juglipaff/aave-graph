import Vue from 'vue'
import VueRouter from 'vue-router'
import Gotchi from '../views/Gotchi.vue'
import ClosedPortals from '../views/ClosedPortals.vue'
import ClosedPortalsBazaar from '../views/ClosedPortalsBazaar.vue'
import OpenPortals from '../views/OpenPortals.vue'
import ERC1155 from '../views/ERC1155info.vue'
// import Consumables from '../views/Consumables.vue'

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
    component: ERC1155,
    props: { isWearable: 0 }
  },
  {
    path: '/consumables',
    name: 'Consumables',
    component: ERC1155,
    props: { isWearable: 2 }
  }, {
    path: '/tickets',
    name: 'Tickets',
    component: ERC1155,
    props: { isWearable: 3 }
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
