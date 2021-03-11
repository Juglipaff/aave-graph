<template>
  <div>
    {{blocksShown}}  <br>
    Points shown:
    10 <input v-model="blocksShown" type="range" min="10" max="800"  class="slider"> 800
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

var rarityArray = []
function toDateTime (secs) {
  const t = new Date(1970, 0, 1)
  secs -= t.getTimezoneOffset() * 60
  t.setSeconds(secs)
  return t
}

function lerpColor (a, b, amount) {
  var ah = +a.replace('#', '0x')
  var ar = ah >> 16
  var ag = ah >> 8 & 0xff
  var ab = ah & 0xff
  var bh = +b.replace('#', '0x')
  var br = bh >> 16
  var bg = bh >> 8 & 0xff
  var bb = bh & 0xff
  var rr = ar + amount * (br - ar)
  var rg = ag + amount * (bg - ag)
  var rb = ab + amount * (bb - ab)
  return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1)
}

export default {
  store,
  components: { Chart },
  name: 'Gotchi',
  computed: {
    ...mapState({
      graphs: 'graphs',
      errors: 'errors'
    })
  },
  data () {
    return {
      chartData: {},
      options: {},
      priceForGotchi: [],
      colorArray: [],
      blocksShown: 100
    }
  },
  methods: {
    updateGraph () {
      var price = 0
      var maxPrice = 0
      this.priceForGotchi = []
      rarityArray = []
      this.colorArray = []
      this.$Progress.start()
      axios.get('https://api.coingecko.com/api/v3/simple/price?ids=aavegotchi&vs_currencies=usd')
        .then(function (response) {
          price = parseFloat(response.data.aavegotchi.usd)
        })
        .catch(function (error) {
          console.log(error)
        })

      this.$store.dispatch('fetchGraph', { blocksShown: this.blocksShown })
        .then(() => {
          this.graphs.forEach(point => {
            if (point.category === 3) {
              const dateNormalised = toDateTime(point.x)
              if (point.y > maxPrice) {
                maxPrice = parseInt(point.y)
              }

              rarityArray.push(point.rarity)
              this.colorArray.push(`${lerpColor('#100000', '#ff0000', Math.min(Math.max((-1800 + point.rarity * 4.5) / 1000), 1), 0)}`)
              this.priceForGotchi.push({ x: dateNormalised, y: point.y })
            }
          })

          this.chartData = {
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
                yAxisID: 'left-y-axis',
                id: 'gotchi'
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
                    min: 0,
                    beginAtZero: true,
                    max: maxPrice,
                    callback: function (value) {
                      return value + ' ' + 'GHST'
                    }
                  },
                  afterBuildTicks: (chartObj) => {
                    const ticks = [0, 5, 10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000]
                    chartObj.ticks = ticks
                  },
                  gridLines: {
                    display: true
                  }
                }
                /*  {
                type: 'logarithmic',
                id: 'right-y-axis',
                ticks: {
                  sampleSize: 1,
                  beginAtZero: true,
                  min: 0,
                  max: parseInt(price * maxPrice),
                  callback: function (value) {
                    return '$' + value
                  }
                },
                gridLines: {
                  display: false
                },
                position: 'right'
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
                    tooltipItem.yLabel + ' GHST',
                    '$' + parseInt(tooltipItem.yLabel * price),
                    'Rarity: ' + rarityArray[tooltipItem.index]
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
button{
  width:70px;
  height:25px;
  margin-bottom:30px;
}
</style>
