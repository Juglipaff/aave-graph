<template>
    <div class="container">
      <button v-on:click="sortPortals">Sort</button> <br>
  <div v-for="listing in listings" :key="listing.link" target="_blank">
   {{parseInt(listing.price)}} GHST, ${{parseInt(listing.price*price)}} - <a :href="listing.link">{{listing.link}}</a><br>
  </div>
    </div>
</template>

<script>

import { mapState } from 'vuex'
import store from '../store/index.js'
import axios from 'axios'
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
      price: 0,
      sort: true
    }
  },
  created () {
    var self = this
    axios.get('https://api.coingecko.com/api/v3/simple/price?ids=aavegotchi&vs_currencies=usd')
      .then(function (response) {
        self.price = parseFloat(response.data.aavegotchi.usd)
      })
      .catch(function (error) {
        console.log(error)
      })
    this.$store.dispatch('updateListing')
      .then(() => {
        this.listings.sort((a, b) => a.price - b.price)
      })
  },
  methods: {
    sortPortals () {
      if (this.sort) {
        this.sort = !this.sort
        this.listings.sort((a, b) => {
          if (b.price < a.price) {
            return -1
          }
          return 1
        })
        return
      }
      this.sort = !this.sort
      this.listings.sort((a, b) => {
        if (a.price < b.price) {
          return -1
        }
        return 1
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
