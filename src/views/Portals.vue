<template>
  <div>
     {{blocksShown}}  <br>
    Points shown:
    10 <input v-model="blocksShown" type="range" min="10" max="1900" cls="slider"> 1900
    <button v-on:click="updateGraph">Update</button>
    <div v-if="errors.length!==0">
      OOPS... Something went wrong... <br>
      You've probably sent way too many requests to the provider...
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
  name: 'Portals',
  computed: {
    ...mapState({
      portalGraphs: 'portalGraphs',
      errors: 'errors'
    })
  },
  data () {
    return {
      chartData: {
        type: 'scatter',
        datasets: []
      },
      options: {
      },
      priceForClosedPortals: [],
      blocksShown: 500
    }
  },
  methods: {
    updateGraph () {
      var price = 0
      var maxPrice = 0
      this.$Progress.start()
      axios.get('https://api.coingecko.com/api/v3/simple/price?ids=aavegotchi&vs_currencies=usd')
        .then(function (response) {
          price = parseFloat(response.data.aavegotchi.usd)
        })
        .catch(function (error) {
          console.log(error)
        })
      this.$store.dispatch('fetchPortalGraph', { blocksShown: this.blocksShown }).then(() => {
        this.portalGraphs.forEach(point => {
          const dateNormalised = toDateTime(point.x)
          this.priceForClosedPortals.push({ x: dateNormalised, y: point.y })
          if (point.y > maxPrice) {
            maxPrice = parseInt(point.y)
          }
        })

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

                  max: maxPrice,
                  callback: function (value) {
                    return value + ' ' + 'GHST'
                  }
                },
                afterBuildTicks: (chartObj) => {
                  const ticks = [0, 5, 10, 50, 100, 500, 1000, 5000, 10000, 50000]
                  chartObj.ticks = ticks
                },
                gridLines: {
                  display: true
                },
                offset: false
              }/*,
            {
              type: 'logarithmic',
              id: 'right-y-axis',
              ticks: {
                beginAtZero: true,
                min: 0,
                max: price * maxPrice,
                callback: function (value) {
                  return '$' + value
                }
              },
              afterBuildTicks: (chartObj) => {
                const ticks = [0, 5, 10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000]
                chartObj.ticks = ticks
              },
              gridLines: {
                display: true
              },
              position: 'right',
              offset: false

            } */

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
              label: function (tooltipItem) {
                const label = tooltipItem.xLabel
                return label
              },
              afterLabel: function (tooltipItem) {
                const label = ['NFT price: ',
                  parseInt(tooltipItem.yLabel) + ' GHST',
                  '$' + parseInt(tooltipItem.yLabel * price)
                ]
                return label
              }
            }
          },
          animation: {
            duration: 0 // general animation time
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
          // Container for pan options
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
