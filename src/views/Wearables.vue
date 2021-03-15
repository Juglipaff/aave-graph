<template>
    <div class="container">
      {{blocksShown}}  <br>
       From Dataset of:
    10 <input v-model="blocksShown" type="range" min="10" max="1500"> 1500
    <button v-on:click="updateGraph()">Update</button>
    <br>
     <div v-if="errors.length!==0">
      OOPS... Something went wrong... <br>
      <div v-for="error in errors" :key="error.message">
        {{error.message}}
      </div>
    </div>
    <button class="sort-button" v-on:click="nextSort">Sort: {{sortMethod}}</button>
    <br>

      <div class="wrapper">
      <button v-for="wearable in wearableList" :class="{
           common: wearable.rarity===1,
           uncommon: wearable.rarity===2,
           rare: wearable.rarity===5,
           legendary: wearable.rarity===10,
           mythical: wearable.rarity===20,
           godlike:  wearable.rarity===50  }" :key="wearable.name" class="plate" v-on:click="filterGraph(wearable.id)">
        <div class="item-name"><div class="rarity">{{returnRarityString(wearable.rarity)}} </div> <div class="name">{{wearable.name}} <br> Traded: {{returnLiquidityForItem(wearable.name)}} time(s)</div></div>
      </button>
   </div>
     <chart  v-bind:chartData="chartData" v-bind:options="options" class="chart"/>
     <div class="links-wrapper">
      <a class="link" :href="listing.link" v-for="listing in wearablesListingsFiltered" :key="listing.link" target="_blank">
      {{parseInt(listing.price)}} GHST, ${{parseInt(listing.price*currentPrice)}}, {{listing.quantity}} Item(s)<br>
     </a>
     </div>
    </div>
</template>

<script>

import { mapState } from 'vuex'
import store from '../store/index.js'
import Chart from '../components/Chart.vue'
import axios from 'axios'

function toDateTime (secs) {
  const t = new Date(1970, 0, 1)
  secs -= t.getTimezoneOffset() * 60
  t.setSeconds(secs)
  return t
}

export default {
  store,
  name: 'Wearables',
  components: { Chart },
  computed: {
    ...mapState({
      wearableList: 'wearableList',
      wearableGraph: 'wearableGraph',
      wearablesListings: 'wearablesListings',
      errors: 'errors'
    })
  },
  data () {
    return {
      chartData: {},
      options: {},
      blocksShown: 1000,
      priceForWearables: [],
      prices: [],
      currentPrice: 0,
      priceForWearablesFiltered: [],
      wearablesListingsFiltered: [],
      sortMethod: 'Alphabetically',
      liquidity: []
    }
  },

  created () {
    this.getWearablesList().then(() => {
      this.updateGraph()
      this.getWearablesListings()
    })
  },
  methods: {
    returnRarityString (rarity) {
      var returnString = 'undefined'
      if (rarity === 1) {
        returnString = 'Common'
      } else if (rarity === 2) {
        returnString = 'Uncommon'
      } else if (rarity === 5) {
        returnString = 'Rare'
      } else if (rarity === 10) {
        returnString = 'Legendary'
      } else if (rarity === 20) {
        returnString = 'Mythical'
      } else if (rarity === 50) {
        returnString = 'Godlike'
      }
      return returnString
    },
    returnLiquidityForItem (name) {
      var liquidityItem = this.liquidity.find((a) => a.name === name)
      return `${liquidityItem ? liquidityItem.liquidityValue : 0}`
    },
    async getWearablesListings () {
      await this.$store.dispatch('fetchWearablesListing', { blocksShown: this.blocksShown }).then(() => {
        this.wearablesListingsFiltered = this.wearablesListings.sort((a, b) => {
          if (a.price < b.price) {
            return -1
          }
          return 1
        })
      })
    },
    async getWearablesList () {
      if (this.wearableList !== []) {
        await this.$store.dispatch('fetchWearablesList')
          .then(() => {
            this.sortWearablesList()
          })
      }
    },
    nextSort () {
      if (this.sortMethod === 'Alphabetically') {
        this.sortMethod = 'by Rarity'
      } else if (this.sortMethod === 'by Rarity') {
        this.sortMethod = 'by Liquidity'
      } else {
        this.sortMethod = 'Alphabetically'
      }
      this.sortWearablesList()
    },
    sortWearablesList () {
      if (this.sortMethod === 'by Rarity') {
        this.wearableList.sort((a, b) => {
          if (a.rarity < b.rarity) {
            return 1
          } else if (a.rarity === b.rarity) {
            if (a.name < b.name) {
              return -1
            }
            return 1
          }
          return -1
        })
      } else if (this.sortMethod === 'by Liquidity') {
        this.wearableList.sort((a, b) => {
          var item1LiquidityValue = parseInt(this.returnLiquidityForItem(a.name), 10)
          var item2LiquidityValue = parseInt(this.returnLiquidityForItem(b.name), 10)
          if (item1LiquidityValue < item2LiquidityValue) {
            return 1
          }
          return -1
        })
      } else {
        this.wearableList.sort((a, b) => {
          if (a.name < b.name) {
            return -1
          }
          return 1
        })
      }
    },

    filterGraph (id) {
      this.priceForWearablesFiltered = this.priceForWearables.filter((x) => x.id === id)
      this.updateGraphComponent(`${this.wearableList.find((obj) => obj.id === id).name}`)
      this.wearablesListingsFiltered = this.wearablesListings.filter((x) => x.id === id)
    },
    getLiquidities () {
      this.liquidity = []
      for (var i = 0; i < this.wearableList.length; i++) {
        var itemLiquidityValue = this.priceForWearablesFiltered.filter((a) =>
          this.wearableList[i].name === a.name
        ).length
        this.liquidity.push({ name: this.wearableList[i].name, liquidityValue: itemLiquidityValue })
      }
    },
    async updateGraph () {
      this.$Progress.start()
      this.priceForWearables = []
      await this.getWearablesListings()
      await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=aavegotchi&vs_currencies=usd')
        .then((response) => {
          this.currentPrice = response.data.aavegotchi.usd
        })
        .catch((error) => {
          console.log(error)
        })
      await axios.get('https://api.coingecko.com/api/v3/coins/aavegotchi/market_chart?vs_currency=usd&days=max&interval=daily')
        .then((response) => {
          this.prices = response.data.prices
        })
        .catch((error) => {
          console.log(error)
        })
      await this.$store.dispatch('fetchWearablesGraph', { blocksShown: this.blocksShown })
        .then(() => {
          for (var i = 0; i < this.wearableGraph.length; i++) {
            const day = Math.floor(this.wearableGraph[i].x / 86400) * 86400
            const price = this.prices.find((obj) => { return obj[0] * 0.001 === day })
            this.priceForWearables.push({ x: toDateTime(this.wearableGraph[i].x), y: this.wearableGraph[i].y * (price ? price[1] : this.currentPrice), GHST: this.wearableGraph[i].y, id: this.wearableGraph[i].id, name: this.wearableList.find((obj) => obj.id === this.wearableGraph[i].id).name })
          }
          this.priceForWearablesFiltered = this.priceForWearables
          this.getLiquidities()
          this.updateGraphComponent('Wearables Prices')
          this.sortWearablesList()
          this.$Progress.finish()
        }).catch(() => {
          this.$Progress.finish()
        })
    },
    updateGraphComponent (label) {
      this.chartData = {
        type: 'scatter',
        datasets: [
          {
            label: label,
            data: this.priceForWearablesFiltered,
            fill: false,
            borderColor: '#0088cc',
            borderWidth: 4,
            type: 'scatter',
            yAxisID: 'left-y-axis'
          }
        ]
      }
      this.options = {
        scales: {
          yAxes: [
            {
              type: 'logarithmic',
              id: 'left-y-axis',
              ticks: {
                callback: (value) => {
                  return `$${value}`
                }
              },
              afterBuildTicks: (chartObj) => {
                const ticks = [0, 5, 10, 50, 100, 500, 1000, 5000, 10000]
                chartObj.ticks = ticks
              },
              gridLines: {
                display: true
              },
              offset: false
            }
          ],
          xAxes: [
            {
              type: 'time',
              time: {
                unit: 'day',
                displayFormats: {
                  day: 'MMM DD'
                }
              },
              ticks: {
                beginAtZero: true
              },
              gridLines: {
                display: true
              },
              offset: false
            }
          ]
        },
        legend: {
          display: true
        },
        elements: {
          point: {
            radius: 2
          }
        },
        tooltips: {
          mode: 'nearest',
          intersect: false,
          callbacks: {
            title: () => {
              const label = []
              return label
            },
            label: (tooltipItem) => {
              const label = tooltipItem.xLabel
              return label
            },
            afterLabel: (tooltipItem, data) => {
              const label = ['NFT price: ',
                    `$${parseInt(tooltipItem.yLabel)}`,
                    `${parseInt(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].GHST)} GHST`,
                    `Name: ${data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].name}`
              ]
              return label
            }
          }
        },
        animation: {
          duration: 0
        },
        hover:
          {
            mode: 'nearest',
            intersect: false,
            animationDuration: 0
          },
        responsive: true,
        responsiveAnimationDuration: 0,
        maintainAspectRatio: false
      }
    }

  }
}
</script>

<style scoped>
.name{
  color:black;
}
.rarity{
font-size:14px;
margin-top:-2px;
margin-bottom:2px;
}
.godlike{
      border: 2px solid rgb(255, 0, 0)  !important;
      background-color: rgb(255, 236, 236)  !important;
      color:rgb(255, 0, 0)
}
.mythical{
      border: 2px solid rgb(255, 150, 255)  !important;
      background-color:  rgb(255, 233, 255)  !important;
      color:rgb(255, 150, 255)
}
.legendary{
      border: 2px solid rgb(255, 195, 107)  !important;
       background-color:  rgb(255, 245, 230)  !important;
       color:rgb(255, 195, 107)
}
.rare{
      border: 2px solid rgb(52, 7, 255) !important;
       background-color: rgb(235, 230, 255) !important;
        color:rgb(52, 7, 255)
}
.uncommon{
      border: 2px solid rgb(51, 186, 204) !important;
       background-color:rgb(230, 252, 255) !important;
        color:rgb(51, 186, 204)
}
.common{
      border: 2px solid rgb(48, 185, 44) !important;
      background-color:rgb(233, 255, 232) !important;
       color:rgb(48, 185, 44)
}
.link{
  margin-right:0;
  margin-left:0;
  padding:0;
  }
.sort-button{
  left:20px;
  margin-top:0px;
 position: absolute;
  height:40px;
   border: 2px solid black;
   background-color:white;
    border-radius: 5px;
    font-size:16px;
}

.links-wrapper{
 margin-top:25px;
 margin-right:0;
  margin-left:0;
  height:calc(100vh - 260px);
  overflow-y:scroll;
   width:290px;
   padding-left:5px;
   float:left;
   left:0px;
}

.chart{
   width:calc(100vw - 600px);
    height:calc(100vh - 205px);
   left:0px;
   float:left;
   top:0;
   position: relative;
}
.wrapper{
  height:calc(100vh - 260px);
  overflow-y:scroll;
  width:280px;
  position: relative;
  float:left;
  top:25px;
}
.item-name{
  margin-top:1px;
  font-size:19px
}
.plate{
  width:230px;
  height:70px;
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
   color: #0088cc;
}

</style>
