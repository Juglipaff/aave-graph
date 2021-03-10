<template>
    <div>
  <a v-for="listing in listings" :key="listing.link" target="_blank" :href="listing.link">
   {{parseInt(listing.price)}} GOTCHI <br>
  </a>
    </div>
</template>

<script>

import { mapState } from 'vuex'
import store from '../store/index.js'
export default {
  store,
  name: 'Bazaar',
  computed: {
    ...mapState({
      listings: 'listings',
      errors: 'errors'
    })
  },
  data () {
    return {
      chartData: {},
      options: {},
      priceForGotchi: [],
      priceForClosedPortals: [],
      colorArray: []
    }
  },
  created () {
    this.$store.dispatch('updateListing')
      .then(() => {
        this.listings.sort((a, b) => a.price - b.price)
      })
  }
}
</script>

<style lang="scss" scoped>

</style>
