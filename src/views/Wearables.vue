<template>
    <div class="container">
      {{blocksShown}}  <br>
       From Dataset of:
    10 <input v-model="blocksShown" type="range" min="10" max="1500"> 1500
    <button v-on:click="updateGraph()">Update</button>
    <br>
     <div v-if="errors.length!==0">
      OOPS... Something went wrong... Check the console for more info<br>
      <div v-for="error in errors" :key="error.message">
        {{error.message}}
      </div>
    </div>
    <button class="sort-button" v-on:click="nextSort">Sort: {{sortMethod}}</button>
        <button class="switch_axis" v-on:click="switchYAxis()"> <div v-if="currentAxis">$</div><div v-else>GHST</div> </button>
    <br>
      <div class="wrapper">
      <button v-for="wearable in wearableList" :class="{
           common: wearable.rarity===1,
           uncommon: wearable.rarity===2,
           rare: wearable.rarity===5,
           legendary: wearable.rarity===10,
           mythical: wearable.rarity===20,
           godlike:  wearable.rarity===50  }" :key="wearable.name" class="plate" v-on:click="filterGraph(wearable.id)">
          <button class="favourite" v-on:click="toggleFavorite(wearable.id)"><font-awesome-icon  :class="getCurrentFavStatus(wearable.id)" :icon="['fas', 'star']"/></button>
        <div class="item-name"><div class="rarity">{{returnRarityString(wearable.rarity)}} </div> <div class="name">{{wearable.name}}<br> Traded: {{returnLiquidityForItem(wearable.name)}} time(s)<br>Total Quantity: {{wearable.quantity}}</div></div>
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
      liquidity: [],
      currentAxis: true,
      maxPrice: 0
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
      if (rarity === 1) {
        return 'Common'
      } else if (rarity === 2) {
        return 'Uncommon'
      } else if (rarity === 5) {
        return 'Rare'
      } else if (rarity === 10) {
        return 'Legendary'
      } else if (rarity === 20) {
        return 'Mythical'
      } else if (rarity === 50) {
        return 'Godlike'
      }
      return 'undefined'
    },
    getCurrentFavStatus (id) {
      const currentFavouriteStatus = localStorage.getItem(id)
      if (currentFavouriteStatus === null || currentFavouriteStatus === undefined) {
        localStorage.setItem(id, false)
        return 'not-fav'
      } else if (currentFavouriteStatus === 'false') {
        return 'not-fav'
      } else if (currentFavouriteStatus === 'true') {
        return 'fav'
      }
    },
    toggleFavorite (id) {
      const currentFavouriteStatus = localStorage.getItem(id)
      if (currentFavouriteStatus === null || currentFavouriteStatus === undefined) {
        localStorage.setItem(id, false)
        return
      }
      const isTrue = (currentFavouriteStatus === 'true')
      localStorage.setItem(id, !isTrue)
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
      } else if (this.sortMethod === 'by Liquidity') {
        this.sortMethod = 'Favourite'
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
      } else if (this.sortMethod === 'Favourite') {
        this.wearableList.sort((a, b) => {
          var favItem1 = localStorage.getItem(a.id)
          var favItem2 = localStorage.getItem(b.id)
          if (favItem1 === 'true' && favItem2 === 'false') {
            return -1
          }
          return 1
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
      this.currentAxis = true
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
    switchYAxis () {
      if (this.chartData.datasets[0] !== undefined) {
        this.currentAxis = !this.currentAxis
        for (var i = 0; i < this.priceForWearablesFiltered.length; i++) {
          this.priceForWearablesFiltered[i] = { x: this.priceForWearablesFiltered[i].x, y: this.priceForWearablesFiltered[i].GHST, GHST: this.priceForWearablesFiltered[i].y, id: this.priceForWearablesFiltered[i].id, name: this.priceForWearablesFiltered[i].name }
        }
        this.chartData = {
          type: 'scatter',
          datasets: [
            {
              label: this.chartData.datasets[0].label,
              data: this.priceForWearablesFiltered,
              fill: this.chartData.datasets[0].fill,
              borderColor: this.chartData.datasets[0].borderColor,
              borderWidth: this.chartData.datasets[0].borderWidth,
              type: this.chartData.datasets[0].type,
              yAxisID: this.chartData.datasets[0].yAxisID
            }
          ]
        }
      }
    },
    async updateGraph () {
      this.$Progress.start()
      this.priceForWearables = []
      await this.getWearablesListings()
      await axios.get('https://api.coingecko.com/api/v3/coins/aavegotchi/market_chart?vs_currency=usd&days=max&interval=daily')
        .then((response) => {
          console.log('got coingecko response')
          this.prices = response.data.prices
          this.currentPrice = this.prices[this.prices.length - 1][1]
        })
        .catch((error) => {
          console.log(error)
        })
      await this.$store.dispatch('fetchWearablesGraph', { blocksShown: this.blocksShown })
        .then(() => {
          for (var i = 0; i < this.wearableGraph.length; i++) {
            const day = Math.floor(this.wearableGraph[i].x / 86400) * 86400
            const price = this.prices.find((obj) => { return obj[0] * 0.001 === day })
            this.priceForWearables.push({ x: toDateTime(this.wearableGraph[i].x), y: parseInt(this.wearableGraph[i].y * (price ? price[1] : this.currentPrice)), GHST: parseInt(this.wearableGraph[i].y), id: this.wearableGraph[i].id, name: this.wearableList.find((obj) => obj.id === this.wearableGraph[i].id).name })
            if (this.priceForWearables[i].y > this.maxPrice) {
              this.maxPrice = this.priceForWearables[i].y
            }
          }
          this.currentAxis = true
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
                beginAtZero: true,
                autoSkip: false,
                padding: 0,
                callback: (value) => {
                  return this.currentAxis ? `$${value}` : `${value} GHST`
                }

              },
              afterBuildTicks: (chartObj) => {
                var tickArray = []
                tickArray.push(0)
                for (var i = 1; i <= this.maxPrice; i *= 1.7) {
                  tickArray.push(parseInt(i))
                }
                chartObj.ticks = tickArray
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
                source: 'date',
                autoSkip: false,
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
                this.currentAxis ? `$${tooltipItem.yLabel}` : `$${data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].GHST}`,
                this.currentAxis ? `${data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].GHST} GHST` : `${tooltipItem.yLabel} GHST`,
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
.switch_axis{
  height:30px;
  width:60px;
  float:left;
  position: absolute;
  left:340px;
  z-index:99
}
.not-fav{
 color:#bbbbbb !important;
 transition:0.2s;
}
.fav{
 color:#F5d500 !important;
 transition:0.2s;
}
.favourite{
  position:absolute;
  font-size:20px;
  left:21px;
  margin-top:2px;
  background-color:transparent;
  border:0px;
  outline:0px;
}
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
  height:90px;
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
