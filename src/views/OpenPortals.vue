<template>
  <div class="container">
    <div v-if="errors.length!==0">
      OOPS... Something went wrong... Check the console for more info<br>
       <div v-for="error in errors" :key="error.message">
        {{error.message}}
      </div>
    </div>
     <button class="switch_axis" v-on:click="switchYAxis()"> <div v-if="currentAxis">$</div><div v-else>GHST</div> </button>
    <chart v-bind:chartData="chartData" v-bind:options="options" id="chart"/>
  </div>
</template>
<script>

import { mapState } from 'vuex'
import store from '../store/index.js'
import Chart from '../components/Chart.vue'
import { ethers } from 'ethers'

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
      errors: 'errors',
      GHSTprices: 'GHSTprices'
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
      rarityLow: 0,
      rarityHigh: 0,
      currentPrice: 0,
      currentAxis: false,
      isRarityTurnedOn: false,
      pricesForOpenPortalsArrays: [],
      maxPrice: 0
    }
  },
  methods: {
    switchYAxis () {
      if (this.chartData.datasets[0] !== undefined) {
        this.currentAxis = !this.currentAxis
        const datasets = []
        for (let k = 0; k < this.pricesForOpenPortalsArrays.length; k++) {
          for (let n = 0; n < this.pricesForOpenPortalsArrays[k].length; n++) {
            this.pricesForOpenPortalsArrays[k][n] = { x: this.pricesForOpenPortalsArrays[k][n].x, y: this.pricesForOpenPortalsArrays[k][n].GHST, rarity: this.pricesForOpenPortalsArrays[k][n].rarity, GHST: this.pricesForOpenPortalsArrays[k][n].y }
          }
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
      }
    },
    async updateGraph () {
      for (var i = 0; i < 7; i++) {
        this.pricesForOpenPortalsArrays[i] = []
      }
      this.$Progress.start()
      if (this.GHSTprices.length === 0) {
        await this.$store.dispatch('fetchGHSTPrices')
          .then(() => {
            console.log('Got axios response')
            this.prices = this.GHSTprices
          })
          .catch((error) => {
            console.log(error)
          })
      } else {
        this.prices = this.GHSTprices
      }
      this.currentPrice = this.prices[this.prices.length - 1][1]
      await this.$store.dispatch('fetchOpenPortalGraph')
        .then(() => {
          for (var i = 0; i < this.openPortalGraph.length; i++) {
            var maxBRS = 0
            for (let n = 0; n < this.openPortalGraph[i].portal.options.length; n++) {
              var BRS = 0
              for (let k = 0; k < 6; k++) {
                const traitValue = this.openPortalGraph[i].portal.options[n].numericTraits[k]
                BRS += traitValue >= 50 ? traitValue : 100 - traitValue
              }
              if (maxBRS < BRS) {
                maxBRS = BRS
              }
            }
            const day = Math.floor(this.openPortalGraph[i].timePurchased / 86400) * 86400
            const price = this.prices.find((obj) => { return obj[0] * 0.001 === day })
            const pointObj = this.currentAxis ? { x: toDateTime(this.openPortalGraph[i].timePurchased), y: ethers.utils.formatEther(this.openPortalGraph[i].priceInWei) * (price ? price[1] : this.currentPrice), rarity: maxBRS, GHST: ethers.utils.formatEther(this.openPortalGraph[i].priceInWei) }
              : { x: toDateTime(this.openPortalGraph[i].timePurchased), y: ethers.utils.formatEther(this.openPortalGraph[i].priceInWei), rarity: maxBRS, GHST: ethers.utils.formatEther(this.openPortalGraph[i].priceInWei) * (price ? price[1] : this.currentPrice) }
            if (parseFloat(pointObj.y) > this.maxPrice) {
              this.maxPrice = pointObj.y
            }
            if (!this.isRarityTurnedOn) {
              if (maxBRS < 420) {
                this.pricesForOpenPortalsArrays[0].push(pointObj)
              } else if (maxBRS < 450) {
                this.pricesForOpenPortalsArrays[1].push(pointObj)
              } else if (maxBRS < 480) {
                this.pricesForOpenPortalsArrays[2].push(pointObj)
              } else if (maxBRS < 510) {
                this.pricesForOpenPortalsArrays[3].push(pointObj)
              } else if (maxBRS < 540) {
                this.pricesForOpenPortalsArrays[4].push(pointObj)
              } else if (maxBRS < 570) {
                this.pricesForOpenPortalsArrays[5].push(pointObj)
              } else {
                this.pricesForOpenPortalsArrays[6].push(pointObj)
              }
              continue
            }
            if (maxBRS <= this.rarityHigh && maxBRS >= this.rarityLow) {
              this.pricesForOpenPortalsArrays[0].push(pointObj)
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
          this.options = {
            scales: {
              yAxes: [
                {
                  type: 'logarithmic',
                  id: 'left-y-axis',
                  afterUpdate: (chartObj) => {
                    var tickArray = []
                    var valuesArray = []
                    var tick = 0.25
                    for (var i = 0; tick <= this.maxPrice * this.currentPrice; i++) {
                      tickArray.push({ label: this.currentAxis ? `$${tick}` : `${tick}GHST`, major: false, value: tick, _index: i })
                      valuesArray.push(tick)
                      tick = tick * 2
                    }
                    tickArray.push({ label: this.currentAxis ? `$${tick}` : `${tick}GHST`, major: false, value: tick, _index: i })
                    valuesArray.push(tick)
                    chartObj.tickValues = valuesArray
                    chartObj._ticks = tickArray
                    chartObj.width = 80
                    chartObj._ticksToDraw = tickArray
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
                  beforeUpdate: (chartObj) => {
                    chartObj.options.ticks.maxRotation = 0
                    chartObj.options.ticks.autoSkip = true
                    chartObj.options.ticks.autoSkipPadding = 20
                    chartObj.options.time.displayFormats.hour = 'hh:mm'
                    chartObj.options.time.displayFormats.minute = 'hh:mm'
                    chartObj.options.time.displayFormats.minUnit = 'minute'
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
                    this.currentAxis ? `$${parseInt(tooltipItem.yLabel)}` : `$${parseInt(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].GHST)}`,
                    this.currentAxis ? `${parseInt(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].GHST)} GHST` : `${parseInt(tooltipItem.yLabel)} GHST`,
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
            maintainAspectRatio: false,
            plugins: {
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
            }
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
.switch_axis{
  float:left;
  margin-bottom:-5px;
  margin-left:20px;
}
button{
  width:70px;
  height:25px;
  margin-bottom:30px;
}
</style>
