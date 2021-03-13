<template>
    <div class="container">
      <div class="wrapper">
      <button v-for="wearable in wearableList" :key="wearable.name" class="plate" v-on:click="filterListings(wearable.id)">
        <div class="item-name">{{wearable.name}}</div>
      </button>
    </div>
     <div v-for="listing in wearablesListingsFiltered" :key="listing.link">
      {{parseInt(listing.price)}} GHST, ${{parseInt(listing.price*price)}}, {{listing.quantity}} Item(s) - <a target="_blank" :href="listing.link">{{listing.link}}</a><br>
     </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import store from '../store/index.js'
import axios from 'axios'

export default {
  store,
  name: 'Wearables',
  computed: {
    ...mapState({
      wearableList: 'wearableList',
      wearablesListings: 'wearablesListings',
      errors: 'errors'
    })
  },
  data () {
    return {
      price: 0,
      wearablesListingsFiltered: []
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
    this.getWearablesList().then(() => {
      this.getWearablesListings().then(() => {
        this.$Progress.finish()
      })
    })
  },
  methods: {
    async getWearablesList () {
      if (this.wearableList !== []) {
        await this.$store.dispatch('fetchWearablesList')
          .then(() => {
            this.wearableList.sort((a, b) => {
              if (a.name < b.name) {
                return -1
              }
              return 1
            })
          })
      }
    },
    async getWearablesListings () {
      await this.$store.dispatch('fetchWearablesListing').then(() => {
        this.wearablesListingsFiltered = this.wearablesListings.sort((a, b) => {
          if (a.price < b.price) {
            return -1
          }
          return 1
        })
      })
    },
    filterListings (id) {
      this.wearablesListingsFiltered = this.wearablesListings.filter((x) => x.id === id)
    }
  }
}

</script>

<style scoped>
a{
  font-size: 18px;
   color: #0088cc;
}
.chart{
   width:calc(100vw - 300px);
    height:calc(100vh - 205px);
   left:0px;
   float:left;
   top:0;
   position: relative;
}
.wrapper{
  height:calc(100vh - 150px);
  overflow-y:scroll;
  width:260px;
  position: relative;
  float:left;
  top:0px;
}
.item-name{
  margin-top:1px;
  font-size:19px
}
.plate{
  width:230px;
  height:50px;
  border: 2px solid black;
  margin-top:3px;
  border-radius: 5px;
  display:block;
  background-color:white;
  margin-left:20px;
}
.plate:hover{
background-color:#f0f0f0
}
.plate:active {

  border:black;
background-color:#e0e0e0
}
.plate:focus{
   outline: none !important;
   border:2px solid #0088cc;
}

a{
   color: #20a060;
}

</style>
