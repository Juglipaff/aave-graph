import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import VueProgressBar from 'vue-progressbar'
import { faStar, faLock, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
Vue.config.productionTip = false
library.add(faStar, faLock, faExternalLinkAlt)
Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.use(VueProgressBar, {
  color: 'rgb(255, 255, 255)',
  failedColor: 'red',
  height: '5px'
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
