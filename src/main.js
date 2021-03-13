import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueProgressBar from 'vue-progressbar'

Vue.config.productionTip = false

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
