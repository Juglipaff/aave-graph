<template>
  <div class="container">
     Closed portals left: {{closedPortalsQuantity}}, Current GHST price: {{currentPrice}}
    <div v-if="errors.length!==0">
      OOPS... Something went wrong... Check the console for more info<br>
      <div v-for="error in errors" :key="error.message">
        {{error.message}}
      </div>
    </div>
      <button class="switch_axis" v-on:click="switchYAxis()"> <div v-if="currentAxis">$</div><div v-else>GHST</div> </button>
    <chart v-bind:chartData="chartData" v-bind:options="options" id="chart"/>
      <div class="links-wrapper">
    <a v-for="listing in closedPortalListings" :key="listing.link" target="_blank" :href="`https://aavegotchi.com/baazaar/erc721/${listing.id}`">
    {{fromWei(listing.priceInWei)}} GHST, ${{parseInt(fromWei(listing.priceInWei)*currentPrice)}}<br>
    </a>
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
      CurrentGHSTprice: 'CurrentGHSTprice'
    })
  },
  data () {
    return {
      chartData: {},
      options: {},
      priceForClosedPortals: [],
      prices: [],
      currentAxis: false,
      currentPrice: 0,
      maxPrice: 0
    }
  },
  methods: {
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
        .then(() => {
          this.currentPrice = this.CurrentGHSTprice
        })
        .catch((err) => {
          console.log(err)
        })
      await this.$store.dispatch('fetchPortalGraph').then(() => {
        for (var i = 0; i < this.closedPortalGraph.length; i++) {
          const day = Math.floor(this.closedPortalGraph[i].timePurchased / 86400) * 86400
          const price = this.prices.find((obj) => { return obj[0] * 0.001 === day })
          this.priceForClosedPortals.push(this.currentAxis ? { x: toDateTime(this.closedPortalGraph[i].timePurchased), y: ethers.utils.formatEther(this.closedPortalGraph[i].priceInWei) * (price ? price[1] : this.currentPrice), GHST: ethers.utils.formatEther(this.closedPortalGraph[i].priceInWei) }
            : { x: toDateTime(this.closedPortalGraph[i].timePurchased), y: ethers.utils.formatEther(this.closedPortalGraph[i].priceInWei), GHST: ethers.utils.formatEther(this.closedPortalGraph[i].priceInWei) * (price ? price[1] : this.currentPrice) })
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
    this.$store.dispatch('fetchClosedPortalListing')
      .then(() => {
        console.log(`Listing length: ${this.closedPortalListings.length}`)
        this.sortPortals()
      })
    this.$store.dispatch('fetchClosedPortalQuantity')
    this.updateGraph()
  }
}
</script>
<style scoped>
.links-wrapper{
 margin-top:25px;
 margin-right:0;
  margin-left:0;
  height:calc(100vh - 230px);
  overflow-y:scroll;
   width:290px;
   padding-left:5px;
   float:left;
   left:0px;
}
.switch_axis{
  position:absolute;
  left:0;
  margin-left:30px;
}
#chart{
  float:left;
  margin-top:30px;
  margin-left:20px;
  width:calc(100vw - 340px);
  height:calc(100vh - 205px);
}
button{
  width:70px;
  height:25px;

}
</style>
