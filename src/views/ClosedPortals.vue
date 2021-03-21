<template>
  <div class="container">
     Closed portals left: {{closedPortalsQuantity}}
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
  name: 'ClosedPortals',
  computed: {
    ...mapState({
      closedPortalsQuantity: 'closedPortalsQuantity',
      closedPortalGraph: 'closedPortalGraph',
      errors: 'errors'
    })
  },
  data () {
    return {
      chartData: {},
      options: {},
      priceForClosedPortals: [],
      prices: [],
      currentPrice: 0
    }
  },
  methods: {
    async updateGraph () {
      this.priceForClosedPortals = []
      this.$Progress.start()
      this.$store.dispatch('fetchClosedPortalQuantity')
      await axios.get('https://api.coingecko.com/api/v3/coins/aavegotchi/market_chart?vs_currency=usd&days=max&interval=daily')
        .then((response) => {
          console.log('got coingecko response')
          this.prices = response.data.prices
          this.currentPrice = this.prices[this.prices.length - 1][1]
        })
        .catch((error) => {
          console.log(error)
        })
      await this.$store.dispatch('fetchPortalGraph').then(() => {
        for (var i = 0; i < this.closedPortalGraph.length; i++) {
          const day = Math.floor(this.closedPortalGraph[i].timePurchased / 86400) * 86400
          const price = this.prices.find((obj) => { return obj[0] * 0.001 === day })
          this.priceForClosedPortals.push({ x: toDateTime(this.closedPortalGraph[i].timePurchased), y: ethers.utils.formatEther(this.closedPortalGraph[i].priceInWei) * (price ? price[1] : this.currentPrice) })
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
                    return `$${value}`
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
                  `$${parseInt(tooltipItem.yLabel)}`,
                  `${parseInt(ethers.utils.formatEther(this.closedPortalGraph[tooltipItem.index].priceInWei))} GHST`
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
