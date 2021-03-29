<template>
  <div class="container">
    Closed portals left: {{closedPortalsQuantity}}
    <div v-if="errors.length!==0">
      OOPS... Something went wrong... Check the console for more info<br>
      <div v-for="error in errors" :key="error.message">
        {{error.message}}
      </div>
    </div>
      <button class="switch_axis" v-on:click="switchYAxis()"> <div v-if="currentAxis">$</div><div v-else>GHST</div> </button>
    <chart v-bind:chartData="chartData" v-bind:options="options" id="chart"/>
      <div v-if="isRegistered" class="links-wrapper">
    <a v-for="listing in closedPortalListings" class="link" :key="listing.link" target="_blank" :href="`https://aavegotchi.com/baazaar/erc721/${listing.id}`">
    <span class="link-text"> {{fromWei(listing.priceInWei)}} GHST, ${{parseInt(fromWei(listing.priceInWei)*currentPrice)}} <font-awesome-icon class="externalLink" :icon="['fas', 'external-link-alt']"/></span><br>
    </a>
   </div>
   <div v-else-if="isRegistered===false" class="placeholder">
     <div class="container3">
     <font-awesome-icon  class="lock" :icon="['fas', 'lock']"/>
     <div class="message">Sorry, you do not have enough rights to view listings.</div>
     </div>
   </div>
   <div v-else class="placeholder">
     <div class="container2">
     <font-awesome-icon  class="lock" :icon="['fas', 'lock']"/>
     <div class="message">Please login with your Metamask account to view listings</div>
     <button class="MetamaskLogin" v-on:click="checkLogin">Login with Metamask</button>
     </div>
   </div>
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
  name: 'ClosedPortals',
  computed: {
    ...mapState({
      closedPortalsQuantity: 'closedPortalsQuantity',
      closedPortalListings: 'closedPortalListings',
      closedPortalGraph: 'closedPortalGraph',
      errors: 'errors',
      GHSTprices: 'GHSTprices',
      currentPrice: 'CurrentGHSTprice',
      isRegistered: 'user'
    })
  },
  data () {
    return {
      chartData: {},
      options: {},
      priceForClosedPortals: [],
      prices: [],
      currentAxis: false,
      maxPrice: 0,
      // minYValue: 0,
      // maxYValue: 0,
      maxDate: new Date(),
      minDate: toDateTime(1614687822)
    }
  },
  watch: {
    isRegistered: function (val) {
      if (val) {
        this.$store.dispatch('fetchClosedPortalListing')
          .then(() => {
            console.log(`Listing length: ${this.closedPortalListings.length}`)
            this.sortPortals()
          })
      }
    }
  },
  methods: {

    checkLogin () {
      this.$store.dispatch('fetchIsRegistered')
    },
    fromWei (wei) {
      return parseInt(ethers.utils.formatEther(wei))
    },
    sortPortals () {
      this.closedPortalListings.sort((a, b) => {
        if (this.fromWei(b.priceInWei) < this.fromWei(a.priceInWei)) {
          return 1
        }
        return -1
      })
    },
    switchYAxis () {
      if (this.chartData.datasets[0] !== undefined) {
        this.currentAxis = !this.currentAxis
        for (let k = 0; k < this.priceForClosedPortals.length; k++) {
          this.priceForClosedPortals[k] = { x: this.priceForClosedPortals[k].x, y: this.priceForClosedPortals[k].GHST, GHST: this.priceForClosedPortals[k].y }
        }
        this.chartData = {
          type: 'scatter',
          datasets: [
            {
              label: 'Price For Closed Portals',
              data: this.priceForClosedPortals,
              fill: false,
              borderColor: '#0088cc',
              borderWidth: 4,
              type: 'scatter',
              yAxisID: 'left-y-axis',
              id: 'closedportal'
            }
          ]
        }
      }
    },
    async updateGraph () {
      this.priceForClosedPortals = []
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
      await this.$store.dispatch('fetchPortalGraph').then(() => {
        for (var i = 0; i < this.closedPortalGraph.length; i++) {
          const day = Math.floor(this.closedPortalGraph[i].timePurchased / 86400) * 86400
          const price = this.prices.find((obj) => { return obj[0] * 0.001 === day })
          const dateTime = toDateTime(this.closedPortalGraph[i].timePurchased)
          this.priceForClosedPortals.push(this.currentAxis ? { x: dateTime, y: ethers.utils.formatEther(this.closedPortalGraph[i].priceInWei) * (price ? price[1] : this.currentPrice), GHST: ethers.utils.formatEther(this.closedPortalGraph[i].priceInWei) }
            : { x: dateTime, y: ethers.utils.formatEther(this.closedPortalGraph[i].priceInWei), GHST: ethers.utils.formatEther(this.closedPortalGraph[i].priceInWei) * (price ? price[1] : this.currentPrice) })
          if (parseFloat(this.priceForClosedPortals[i].y) > this.maxPrice) {
            this.maxPrice = this.priceForClosedPortals[i].y
          }
        }

        this.chartData = {
          type: 'scatter',
          datasets: [
            {
              label: 'Price For Closed Portals',
              data: this.priceForClosedPortals,
              fill: false,
              borderColor: '#0088cc',
              borderWidth: 4,
              type: 'scatter',
              yAxisID: 'left-y-axis',
              id: 'closedportal'
            }
          ]
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
                  var tick = parseInt(this.maxPrice)
                  for (var i = 0; tick !== 0.25; i++) {
                    tickArray.push({ label: this.currentAxis ? `$${tick}` : `${tick}GHST`, major: false, value: tick, _index: i })
                    valuesArray.push(tick)
                    tick = (tick < 2) ? tick * 0.5 : parseInt(tick * 0.5)
                  }
                  chartObj.tickValues = valuesArray
                  chartObj._ticks = tickArray
                  chartObj.width = 80
                  chartObj._ticksToDraw = tickArray
                  // chartObj.min = this.minYValue
                //  chartObj.max = this.maxYValue
                  // console.log(chartObj)
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
                  this.currentAxis ? `${parseInt(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].GHST)} GHST` : `${parseInt(tooltipItem.yLabel)} GHST`
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
                mode: 'x',
                rangeMax: {
                  x: this.maxDate
                },
                rangeMin: {
                  x: this.minDate
                },
                onPan: (chart) => {
                //  this.minYValue = chart.chart.chartArea.bottom
                  // this.maxYValue = chart.chart.chartArea.right
                }
              },
              zoom: {
                enabled: true,
                mode: 'x',
                rangeMin: { x: this.minDate },
                rangeMax: { x: this.maxDate },
                onZoom: (chart) => {
                //  this.minYValue = chart.chart.chartArea.bottom
                  // this.maxYValue = chart.chart.chartArea.right
                }
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
    if (this.isRegistered) {
      this.$store.dispatch('fetchClosedPortalListing')
        .then(() => {
          console.log(`Listing length: ${this.closedPortalListings.length}`)
          this.sortPortals()
        })
    }
    this.$store.dispatch('fetchClosedPortalQuantity')
    this.updateGraph()
  }
}
</script>
<style scoped>

.switch_axis{
  position:absolute;
  left:0;
    width:70px;
  height:25px;
  margin-left:30px;
}
#chart{
  float:left;
  margin-top:30px;
  margin-left:20px;
  width:calc(100vw - 350px);
  height:calc(100vh - 205px);
}

</style>
