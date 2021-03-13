<template>
  <div class="container">
     {{blocksShown}}  <br>
    Points shown:
    10 <input v-model="blocksShown" type="range" min="10" max="1900" cls="slider"> 1900
    <button v-on:click="updateGraph">Update</button>
    <div v-if="errors.length!==0">
      OOPS... Something went wrong... <br>
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
  name: 'ClosedPortals',
  computed: {
    ...mapState({
      closedPortalGraph: 'closedPortalGraph',
      errors: 'errors'
    })
  },
  data () {
    return {
      chartData: {},
      options: {},
      priceForClosedPortals: [],
      blocksShown: 500,
      prices: [],
      currentPrice: 0
      // maxPrice: 0
    }
  },
  methods: {
    async updateGraph () {
      this.priceForClosedPortals = []
      this.$Progress.start()
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
      await this.$store.dispatch('fetchPortalGraph', { blocksShown: this.blocksShown }).then(() => {
        for (var i = 0; i < this.closedPortalGraph.length; i++) {
          const day = Math.floor(this.closedPortalGraph[i].x / 86400) * 86400
          const price = this.prices.find((obj) => { return obj[0] * 0.001 === day })
          this.priceForClosedPortals.push({ x: toDateTime(this.closedPortalGraph[i].x), y: this.closedPortalGraph[i].y * (price ? price[1] : this.currentPrice) })
          /*   if (this.closedPortalGraph[i].y > this.maxPrice) {
            this.maxPrice = parseInt(this.closedPortalGraph[i].y)
          } */
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
                ticks: {
                  // max: this.maxPrice,
                  callback: (value) => {
                    return '$' + value
                  }
                },
                afterBuildTicks: (chartObj) => {
                  const ticks = [0, 10, 50, 100, 500, 1000, 5000, 10000, 50000]
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
              afterLabel: (tooltipItem) => {
                const label = ['NFT price: ',
                  '$' + parseInt(tooltipItem.yLabel),
                  parseInt(this.closedPortalGraph[tooltipItem.index].y) + ' GHST'
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

#chart{
  margin-top:30px;
}
button{
  width:70px;
  height:25px;

}
</style>
