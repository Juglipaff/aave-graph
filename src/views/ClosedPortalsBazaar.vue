<template>
    <div class="container">
     Closed portals left: {{closedPortalsQuantity}}
      <button v-on:click="sortPortals">Sort</button> <br>
  <div v-for="listing in closedPortalListings" :key="listing.link" >
   {{fromWei(listing.priceInWei)}} GHST, ${{parseInt(fromWei(listing.priceInWei)*price)}} - <a target="_blank" :href="`https://aavegotchi.com/baazaar/erc721/${listing.id}`">{{`https://aavegotchi.com/baazaar/erc721/${listing.id}`}}</a><br>
  </div>
    </div>
</template>

<script>

import { mapState } from 'vuex'
import { ethers } from 'ethers'
import store from '../store/index.js'
import axios from 'axios'
export default {
  store,
  name: 'ClosedPortalsBazaar',
  computed: {
    ...mapState({
      closedPortalsQuantity: 'closedPortalsQuantity',
      closedPortalListings: 'closedPortalListings',
      errors: 'errors'
    })
  },
  data () {
    return {
      price: 0,
      sort: true
    }
  },
  created () {
    this.$Progress.start()
    axios.get('https://api.coingecko.com/api/v3/simple/price?ids=aavegotchi&vs_currencies=usd')
      .then((response) => {
        this.price = parseFloat(response.data.aavegotchi.usd)
      })
      .catch((error) => {
        console.log(error)
      })
    this.$store.dispatch('fetchClosedPortalListing')
      .then(() => {
        console.log(`Listing length: ${this.closedPortalListings.length}`)
        this.sortPortals()
        this.$Progress.finish()
      })
    this.$store.dispatch('fetchClosedPortalQuantity')
  },
  methods: {
    fromWei (wei) {
      return parseInt(ethers.utils.formatEther(wei))
    },
    sortPortals () {
      this.sort = !this.sort
      this.closedPortalListings.sort((a, b) => {
        if (this.fromWei(b.priceInWei) < this.fromWei(a.priceInWei)) {
          return this.sort ? -1 : 1
        }
        return this.sort ? 1 : -1
      })
    }
  }
}
</script>

<style scoped>
a{
  font-size: 18px;
   color: #0088cc;
}
button{
  width:80px;
  height:30px;
  margin-bottom:30px;
}
</style>
