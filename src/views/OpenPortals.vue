<template>
  <div class="container">

<input type="checkbox"  v-model="isRarityTurnedOn"> Custom rarity: From <input type="number" v-model="rarityLow"  min="0" max="1000">
     To <input type="number" v-model="rarityHigh"  min="0" max="1000"> <br>    <br>
    {{blocksShown}}  <br>

    Points shown:
    10 <input v-model="blocksShown" type="range" min="10" max="1300"> 1300
    <button v-on:click="updateGraph">Update</button>
    <div v-if="errors.length!==0">
      OOPS... Something went wrong... Check the console for more info<br>
       <div v-for="error in errors" :key="error.message">
        {{error.message}}
      </div>
    </div>
    <chart v-bind:chartData="chartData" v-bind:options="options" id="chart"/>
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
  components: { Chart },
  name: 'OpenPortals',
  computed: {
    ...mapState({
      openPortalGraph: 'openPortalGraph',
      errors: 'errors'
    })
  },
  data () {
    return {
      chartData: {
        type: 'scatter'
      },
      options: {},
      colorArray: [
        'rgba(170, 170, 170, 255)',
        'rgba(100, 100, 230, 255)',
        'rgba(100, 230, 100, 255)',
        'rgba(230, 100, 100, 255)',
        'rgba(255, 165, 0, 255)',
        'rgba(230, 100, 230, 255)',
        'rgba(100, 230, 230, 255)'
      ],
      prices: [],
      blocksShown: 500,
      rarityLow: 0,
      rarityHigh: 0,
      currentPrice: 0,
      isRarityTurnedOn: false,
      // maxPrice: 0,
      pricesForOpenPortalsArrays: []

    }
  },
  methods: {

    async updateGraph () {
      for (var i = 0; i < 7; i++) {
        this.pricesForOpenPortalsArrays[i] = []
      }
      this.$Progress.start()

      await axios.get('https://api.coingecko.com/api/v3/coins/aavegotchi/market_chart?vs_currency=usd&days=max&interval=daily')
        .then((response) => {
          console.log('got coingecko response')
          this.prices = response.data.prices
          this.currentPrice = this.prices[this.prices.length - 1][1]
        })
        .catch((error) => {
          console.log(error)
        })

      await this.$store.dispatch('fetchOpenPortalGraph', { blocksShown: this.blocksShown })
        .then(() => {
          for (var i = 0; i < this.openPortalGraph.length; i++) {
            if (this.openPortalGraph[i].rarity !== undefined) {
              // if (this.openPortalGraph[i].y > this.maxPrice) {
              //   this.maxPrice = parseInt(this.openPortalGraph[i].y)
            //  }
              // this.colorArray.push(`${lerpColor('#100000', '#ff0000', Math.min(Math.max((-1800 + this.graphs[i].rarity * 4.5) / 1000), 1), 0)}`)
              const day = Math.floor(this.openPortalGraph[i].x / 86400) * 86400
              const price = this.prices.find((obj) => { return obj[0] * 0.001 === day })
              // this.priceForGotchi.push({ x: toDateTime(this.graphs[i].x), y: this.graphs[i].y * (price ? price[1] : this.currentPrice) })
              if (!this.isRarityTurnedOn) {
                if (this.openPortalGraph[i].rarity < 420) {
                  this.pricesForOpenPortalsArrays[0].push({ x: toDateTime(this.openPortalGraph[i].x), y: this.openPortalGraph[i].y * (price ? price[1] : this.currentPrice), rarity: this.openPortalGraph[i].rarity, GHST: this.openPortalGraph[i].y })
                } else if (this.openPortalGraph[i].rarity < 450) {
                  this.pricesForOpenPortalsArrays[1].push({ x: toDateTime(this.openPortalGraph[i].x), y: this.openPortalGraph[i].y * (price ? price[1] : this.currentPrice), rarity: this.openPortalGraph[i].rarity, GHST: this.openPortalGraph[i].y })
                } else if (this.openPortalGraph[i].rarity < 480) {
                  this.pricesForOpenPortalsArrays[2].push({ x: toDateTime(this.openPortalGraph[i].x), y: this.openPortalGraph[i].y * (price ? price[1] : this.currentPrice), rarity: this.openPortalGraph[i].rarity, GHST: this.openPortalGraph[i].y })
                } else if (this.openPortalGraph[i].rarity < 510) {
                  this.pricesForOpenPortalsArrays[3].push({ x: toDateTime(this.openPortalGraph[i].x), y: this.openPortalGraph[i].y * (price ? price[1] : this.currentPrice), rarity: this.openPortalGraph[i].rarity, GHST: this.openPortalGraph[i].y })
                } else if (this.openPortalGraph[i].rarity < 540) {
                  this.pricesForOpenPortalsArrays[4].push({ x: toDateTime(this.openPortalGraph[i].x), y: this.openPortalGraph[i].y * (price ? price[1] : this.currentPrice), rarity: this.openPortalGraph[i].rarity, GHST: this.openPortalGraph[i].y })
                } else if (this.openPortalGraph[i].rarity < 570) {
                  this.pricesForOpenPortalsArrays[5].push({ x: toDateTime(this.openPortalGraph[i].x), y: this.openPortalGraph[i].y * (price ? price[1] : this.currentPrice), rarity: this.openPortalGraph[i].rarity, GHST: this.openPortalGraph[i].y })
                } else {
                  this.pricesForOpenPortalsArrays[6].push({ x: toDateTime(this.openPortalGraph[i].x), y: this.openPortalGraph[i].y * (price ? price[1] : this.currentPrice), rarity: this.openPortalGraph[i].rarity, GHST: this.openPortalGraph[i].y })
                }
                continue
              }
              if (this.openPortalGraph[i].rarity <= this.rarityHigh && this.openPortalGraph[i].rarity >= this.rarityLow) {
                this.pricesForOpenPortalsArrays[0].push({ x: toDateTime(this.openPortalGraph[i].x), y: this.openPortalGraph[i].y * (price ? price[1] : this.currentPrice), rarity: this.openPortalGraph[i].rarity, GHST: this.openPortalGraph[i].y })
              }
            }
          }

          const datasets = []
          for (var k = 0; k < this.pricesForOpenPortalsArrays.length; k++) {
            if (this.pricesForOpenPortalsArrays[k].length !== 0) {
              datasets.push({
                label: `${this.isRarityTurnedOn === true ? 'custom Rarity' : 'To ' + (350 + k * 60)}`,
                data: this.pricesForOpenPortalsArrays[k],
                fill: true,
                borderColor: this.colorArray[k],
                backgroundColor: this.colorArray[k],
                borderWidth: 4,
                type: 'scatter',
                yAxisID: 'left-y-axis'
              })
            }
          }

          this.chartData = {
            type: 'scatter',
            datasets: datasets
          }
          /* this.chartData = {
            type: 'scatter',
            datasets: [
              {
                label: 'Price For Gotchi',
                data: this.priceForGotchi,
                fill: true,
                borderColor: this.colorArray,
                backgroundColor: 'rgba(255, 0, 0, 255)',
                borderWidth: 4,
                type: 'scatter',
                yAxisID: 'left-y-axis'
              }
            ]
          } */
          this.options = {
            scales: {
              yAxes: [
                {
                  type: 'logarithmic',
                  id: 'left-y-axis',
                  ticks: {

                    //  max: this.maxPrice,
                    callback: (value) => {
                      return `$${value}`
                    }
                  },
                  afterBuildTicks: (chartObj) => {
                    const ticks = [0, 10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000]
                    chartObj.ticks = ticks
                  },
                  gridLines: {
                    display: true
                  }
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
                    `Rarity: ${data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].rarity}`
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
            /* plugins: {
              zoom: {
                pan: {
                  enabled: true,
                  mode: 'x'
                },
                zoom: {
                  enabled: true,
                  mode: 'x'
                }
              }
            } */
          }

          this.$Progress.finish()
        })
        .catch(error => { console.log(error); this.$Progress.finish() })
    }
  },
  created () {
    this.updateGraph()
  }

}
</script>
<style scoped>
button{
  width:70px;
  height:25px;
  margin-bottom:30px;
}
</style>
