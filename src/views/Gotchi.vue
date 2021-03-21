<template>
  <div class="container">

<input class="checkbox" type="checkbox"  v-model="isRarityTurnedOn"> Custom rarity: From <input type="number" v-model="rarityLow"  min="0" max="1000">
     To <input type="number" v-model="rarityHigh"  min="0" max="1000"> <br>
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
  name: 'Gotchi',
  computed: {
    ...mapState({
      gotchiGraph: 'gotchiGraph',
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
      rarityLow: 0,
      rarityHigh: 0,
      currentPrice: 0,
      isRarityTurnedOn: false,
      priceForGotchisArrays: []

    }
  },
  methods: {

    async updateGraph () {
      for (var i = 0; i < 7; i++) {
        this.priceForGotchisArrays[i] = []
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
      await this.$store.dispatch('fetchGotchiGraph')
        .then(() => {
          for (var i = 0; i < this.gotchiGraph.length; i++) {
            const day = Math.floor(this.gotchiGraph[i].timePurchased / 86400) * 86400
            const price = this.prices.find((obj) => { return obj[0] * 0.001 === day })
            const pointObj = { x: toDateTime(this.gotchiGraph[i].timePurchased), y: ethers.utils.formatEther(this.gotchiGraph[i].priceInWei) * (price ? price[1] : this.currentPrice), rarity: this.gotchiGraph[i].gotchi.modifiedRarityScore, GHST: ethers.utils.formatEther(this.gotchiGraph[i].priceInWei) }
            if (!this.isRarityTurnedOn) {
              if (this.gotchiGraph[i].gotchi.modifiedRarityScore < 350) {
                this.priceForGotchisArrays[0].push(pointObj)
              } else if (this.gotchiGraph[i].gotchi.modifiedRarityScore < 410) {
                this.priceForGotchisArrays[1].push(pointObj)
              } else if (this.gotchiGraph[i].gotchi.modifiedRarityScore < 470) {
                this.priceForGotchisArrays[2].push(pointObj)
              } else if (this.gotchiGraph[i].gotchi.modifiedRarityScore < 530) {
                this.priceForGotchisArrays[3].push(pointObj)
              } else if (this.gotchiGraph[i].gotchi.modifiedRarityScore < 590) {
                this.priceForGotchisArrays[4].push(pointObj)
              } else if (this.gotchiGraph[i].gotchi.modifiedRarityScore < 650) {
                this.priceForGotchisArrays[5].push(pointObj)
              } else {
                this.priceForGotchisArrays[6].push(pointObj)
              }
              continue
            }
            if (this.gotchiGraph[i].gotchi.modifiedRarityScore <= this.rarityHigh && this.gotchiGraph[i].gotchi.modifiedRarityScore >= this.rarityLow) {
              this.priceForGotchisArrays[0].push(pointObj)
            }
          }

          const datasets = []
          for (var k = 0; k < this.priceForGotchisArrays.length; k++) {
            if (this.priceForGotchisArrays[k].length !== 0) {
              datasets.push({
                label: `${this.isRarityTurnedOn === true ? 'custom Rarity' : 'To ' + (350 + k * 60)}`,
                data: this.priceForGotchisArrays[k],
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
