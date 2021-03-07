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

function toDateTime (secs) {
  const t = new Date(1970, 0, 1)
  t.setSeconds(secs)
  return t
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
      price: [],
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
        this.price.push({ x: dateNormalised, y: point.y })
        if (point.closedPortal) {
          this.colorArray.push('rgba(0,0,0,0)')
        } else {
          this.colorArray.push('rgba(191,158,252,255)')
        }
        if (point.y > maxPrice) {
          maxPrice = point.y
        }
      })

      this.chartData = {
        type: 'scatter',
        datasets: [
          {
            label: 'NFT price',
            data: this.price,
            fill: false,
            borderColor: this.colorArray,
            backgroundColor: this.colorArray,
            borderWidth: 5,
            type: 'scatter',
            yAxisID: 'left-y-axis'
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
          display: true
        },
        elements: {
          point: {
            radius: 1
          }
        },
        tooltips: {
          mode: 'nearest',
          intersect: false,
          callbacks: {
            label: function (tooltipItem) {
              var label = 'NFT price: ' +
               tooltipItem.yLabel + ' ' +
                'GHST' +
                '   ' + '$' +
                 parseInt(tooltipItem.yLabel * price)
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
