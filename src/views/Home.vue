<template>
  <div>
    <chart v-bind:chartData="chartData" v-bind:options="options"/>
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
  name: 'Home',
  computed: {
    ...mapState({
      graphs: 'graphs'
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
      priceForGotchi: [],
      priceForClosedPortals: [],
      colorArray: []
    }
  },
  created () {
    var price = 0
    var maxPrice = 0
    axios.get('https://api.coingecko.com/api/v3/simple/price?ids=aavegotchi&vs_currencies=usd')
      .then(function (response) {
        // handle success
        price = parseFloat(response.data.aavegotchi.usd)
      })
      .catch(function (error) {
        console.log(error)
      })
    this.$store.dispatch('fetchGraph').then(() => {
      this.graphs.forEach(point => {
        const dateNormalised = toDateTime(point.x)
        if (point.y > maxPrice) {
          maxPrice = point.y
        }
        if (point.category === 3) {
          rarityArray.push(point.rarity)
          this.colorArray.push(`${lerpColor('#100000', '#ff0000', Math.min(Math.max((-2000 + point.rarity * 5) / 1000), 1), 0)}`)
          this.priceForGotchi.push({ x: dateNormalised, y: point.y })
        } else if (point.category === 0) {
          this.priceForClosedPortals.push({ x: dateNormalised, y: point.y })
        }
      })

      this.chartData = {
        type: 'scatter',
        datasets: [
          {
            label: 'Price For Gotchi',
            data: this.priceForGotchi,
            fill: true,
            borderColor: this.colorArray, // 'rgba(191, 158, 252, 255)',
            backgroundColor: 'rgba(255, 0, 0, 255)',
            borderWidth: 5,
            type: 'scatter',
            yAxisID: 'left-y-axis',
            id: 'gotchi'
          },
          {
            label: 'Price For Closed Portals',
            data: this.priceForClosedPortals,
            fill: false,
            borderColor: 'rgba(0, 0, 255, 255)',

            borderWidth: 7,
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
              id: 'left-y-axis',
              ticks: {
                beginAtZero: true,
                callback: function (value) {
                  return value + ' ' + 'GHST'
                }
              },
              gridLines: {
                display: true
              }
            },
            {
              id: 'right-y-axis',
              ticks: {
                beginAtZero: true,
                suggestedMax: price * maxPrice,
                callback: function (value) {
                  return '$' + value
                }
              },
              gridLines: {
                display: false
              },
              position: 'right'

            }

          ],
          xAxes: [
            {
              type: 'time',
              time: {
                displayFormats: {
                  second: 'h:mm:ss a'
                }
              },
              ticks: {
                beginAtZero: true
              },
              gridLines: {
                display: true
              },
              offset: true
            }
          ]
        },

        legend: {
          maxWidth: 40,
          maxHeight: 40,
          labels: {
            color: 'rgb(255, 0, 0)',
            boxHeight: 40,
            boxWidth: 40
          },
          display: true

        },
        elements: {
          point: {
            radius: 3
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
            afterLabel: function (tooltipItem, data) {
              const label = ['NFT price: ',
                tooltipItem.yLabel + ' GHST',
                '$' + parseInt(tooltipItem.yLabel * price),
                'rarity: ' + rarityArray[tooltipItem.index]
              ]
              if (data.datasets[tooltipItem.datasetIndex].id === 'closedportal') {
                label.splice(-1, 1)
              }
              return label
            }
          }
        },
        hover:
        {
          mode: 'nearest',
          intersect: false
        },
        responsive: true,
        maintainAspectRatio: false
      }
    })
  }

}
</script>
