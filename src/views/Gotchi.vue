<template>
  <div class="container">
<input class="checkbox" type="checkbox"  v-model="isRarityTurnedOn"> Custom rarity: From <input type="number" v-model="rarityLow"  min="0" max="1000">
     To <input type="number" v-model="rarityHigh"  min="0" max="1000"> <button v-on:click="updateGraph">Update</button> <br>
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
  name: 'Gotchi',
  computed: {
    ...mapState({
      gotchiGraph: 'gotchiGraph',
      errors: 'errors',
      GHSTprices: 'GHSTprices',
      currentPrice: 'CurrentGHSTprice'
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
      // currentPrice: 0,
      currentAxis: false,
      isRarityTurnedOn: false,
      priceForGotchisArrays: [],
      maxPrice: 0,
      maxDate: new Date(),
      minDate: toDateTime(1614687822)
    }
  },
  methods: {
    switchYAxis () {
      if (this.chartData.datasets[0] !== undefined) {
        this.currentAxis = !this.currentAxis
        const datasets = []
        for (let k = 0; k < this.priceForGotchisArrays.length; k++) {
          for (let n = 0; n < this.priceForGotchisArrays[k].length; n++) {
            this.priceForGotchisArrays[k][n] = { x: this.priceForGotchisArrays[k][n].x, y: this.priceForGotchisArrays[k][n].GHST, rarity: this.priceForGotchisArrays[k][n].rarity, GHST: this.priceForGotchisArrays[k][n].y }
          }
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
      }
    },
    async updateGraph () {
      for (var i = 0; i < 7; i++) {
        this.priceForGotchisArrays[i] = []
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
      await this.$store.dispatch('fetchCurentGHSTPrice')
        .catch((err) => {
          console.log(err)
        })
      await this.$store.dispatch('fetchGotchiGraph')
        .then(() => {
          for (var i = 0; i < this.gotchiGraph.length; i++) {
            const day = Math.floor(this.gotchiGraph[i].timePurchased / 86400) * 86400
            const price = this.prices.find((obj) => { return obj[0] * 0.001 === day })
            const pointObj = this.currentAxis ? { x: toDateTime(this.gotchiGraph[i].timePurchased), y: ethers.utils.formatEther(this.gotchiGraph[i].priceInWei) * (price ? price[1] : this.currentPrice), rarity: this.gotchiGraph[i].gotchi.modifiedRarityScore, GHST: ethers.utils.formatEther(this.gotchiGraph[i].priceInWei) }
              : { x: toDateTime(this.gotchiGraph[i].timePurchased), y: ethers.utils.formatEther(this.gotchiGraph[i].priceInWei), rarity: this.gotchiGraph[i].gotchi.modifiedRarityScore, GHST: ethers.utils.formatEther(this.gotchiGraph[i].priceInWei) * (price ? price[1] : this.currentPrice) }
            if (parseFloat(pointObj.y) > this.maxPrice) {
              this.maxPrice = pointObj.y
            }
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

          this.options = {
            scales: {
              yAxes: [
                {
                  type: 'logarithmic',
                  id: 'left-y-axis',
                  afterUpdate: (chartObj) => {
                    var tickArray = []
                    var valuesArray = []
                    var max = chartObj.max
                    var min = chartObj.min
                    var tick = min
                    var delta = Math.pow(max / min, 0.1)
                    for (var i = 0; i < 11; i++) {
                      tickArray.push({ label: this.currentAxis ? `$${parseFloat(tick.toFixed(2))}` : `${parseFloat(tick.toFixed(1))}GHST`, major: false, value: parseFloat(tick.toFixed(1)), _index: i })
                      valuesArray.push(parseFloat(tick.toFixed(1)))
                      tick = tick * delta
                    }

                    chartObj.tickValues = valuesArray
                    chartObj._ticks = tickArray
                    chartObj.width = 100
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
            plugins: {
              zoom: {
                pan: {
                  enabled: true,
                  mode: 'x',
                  rangeMax: {
                    x: this.maxDate
                  },
                  rangeMin: {
                    x: this.minDate
                  }
                /*  onPanComplete: (chart) => {
                    let maxValue = 0
                    let minValue = 9007199254740990
                    const obj = chart.chart.visiblePoints
                    for (var i = obj[0]; i < obj[obj.length - 1]; i++) {
                      const point = parseFloat(chart.chart.data.datasets[0].data[i].y)
                      if (point > maxValue) {
                        maxValue = point
                      }
                      if (point < minValue) {
                        minValue = point
                      }
                    }
                    chart.chart.setZoom(minValue * 0.8, maxValue * 1.2)
                  } */
                },
                zoom: {
                  enabled: true,
                  mode: 'x',
                  rangeMax: {
                    x: this.maxDate
                  },
                  rangeMin: {
                    x: this.minDate
                  }
                  /* onZoomComplete: (chart) => {
                    let maxValue = 0
                    let minValue = 9007199254740990
                    console.log(chart.chart.data.datasets)
                    const obj = chart.chart.visiblePoints
                    for (var i = obj[0]; i < obj[obj.length - 1]; i++) {
                      const point = parseFloat(chart.chart.data.datasets[0].data[i].y)
                      if (point > maxValue) {
                        maxValue = point
                      }
                      if (point < minValue) {
                        minValue = point
                      }
                    }
                    chart.chart.setZoom(minValue * 0.8, maxValue * 1.2)
                  } */
                }
              }
            },
            responsive: true,
            responsiveAnimationDuration: 0,
            maintainAspectRatio: false
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
  margin-bottom:20px;
  margin-left:30px;
}
button{
  width:70px;
  height:25px;
  margin-bottom:30px;
}
</style>
