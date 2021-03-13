<template>
    <div class="container">
      {{blocksShown}}  <br>
       From the Dataset:
    10 <input v-model="blocksShown" type="range" min="10" max="1400"> 1400
    <button v-on:click="updateGraph()">Update</button>
    <br>
     <div v-if="errors.length!==0">
      OOPS... Something went wrong... <br>
      <div v-for="error in errors" :key="error.message">
        {{error.message}}
      </div>
    </div>
    <br>
      <div class="wrapper">
      <button v-for="wearable in wearableList" :key="wearable.name" class="plate" v-on:click="updateGraphandCurrentId(wearable.id)">
        <div class="item-name">{{wearable.name}}</div>
      </button>
   </div>
     <chart  v-bind:chartData="chartData" v-bind:options="options" class="chart"/>
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
  name: 'Wearables',
  components: { Chart },
  computed: {
    ...mapState({
      wearableList: 'wearableList',
      wearableGraph: 'wearableGraph',
      errors: 'errors'
    })
  },
  data () {
    return {
      chartData: {},
      options: {},
      blocksShown: 1000,
      priceForWearables: [],
      prices: [],
      currentPrice: 0,
      currentItemId: -1
    }
  },
  created () {
    this.getWearablesList().then(() => {
      this.updateGraph()
    })
  },
  methods: {
    async getWearablesList () {
      await this.$store.dispatch('fetchWearablesList')
        .then(() => {
          this.wearableList.sort((a, b) => {
            if (a.name < b.name) {
              return -1
            }
            return 1
          })
        })
    },
    updateGraphandCurrentId (wearableId) {
      this.currentItemId = wearableId
      this.updateGraph()
    },
    async updateGraph () {
      this.$Progress.start()
      this.priceForWearables = []
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
      await this.$store.dispatch('fetchWearablesGraph', { blocksShown: this.blocksShown })
        .then(() => {
          for (var i = 0; i < this.wearableGraph.length; i++) {
            const day = Math.floor(this.wearableGraph[i].x / 86400) * 86400
            const price = this.prices.find((obj) => { return obj[0] * 0.001 === day })
            if (this.currentItemId === this.wearableGraph[i].id || this.currentItemId === -1) {
              this.priceForWearables.push({ x: toDateTime(this.wearableGraph[i].x), y: this.wearableGraph[i].y * (price ? price[1] : this.currentPrice), GHST: this.wearableGraph[i].y, name: this.wearableList.find((obj) => obj.id === this.wearableGraph[i].id).name })
              continue
            }
          }
          const label = this.wearableList.find((obj) => obj.id === this.currentItemId)
          this.chartData = {
            type: 'scatter',
            datasets: [
              {
                label: label ? label.name : 'Wearables Graph',
                data: this.priceForWearables,
                fill: false,
                borderColor: '#0088cc',
                borderWidth: 4,
                type: 'scatter',
                yAxisID: 'left-y-axis'
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
                    callback: (value) => {
                      return '$' + value
                    }
                  },
                  afterBuildTicks: (chartObj) => {
                    const ticks = [0, 5, 10, 50, 100, 500, 1000, 5000, 10000]
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
                afterLabel: (tooltipItem, data) => {
                  const label = ['NFT price: ',
                    `$ ${parseInt(tooltipItem.yLabel)}`,
                    `${parseInt(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].GHST)} GHST`,
                    `Name: ${data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].name}`
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
        }).catch(() => {
          this.$Progress.finish()
        })
    }
  }
}
</script>

<style scoped>
.chart{
   width:calc(100vw - 300px);
    height:calc(100vh - 205px);
   left:0px;
   float:left;
   top:0;
   position: relative;
}
.wrapper{
  height:calc(100vh - 260px);
  overflow-y:scroll;
  width:260px;
  position: relative;
  float:left;
  top:25px;
}
.item-name{
  margin-top:1px;
  font-size:19px
}
.plate{
  width:230px;
  height:50px;
  border: 2px solid black;
  margin-top:3px;
  border-radius: 5px;
  display:block;
  background-color:white;
  margin-left:20px;
}
.plate:hover{
background-color:#f0f0f0
}
.plate:active {

  border:black;
background-color:#e0e0e0
}
.plate:focus{
   outline: none !important;
   border:2px solid #0088cc;
}

a{
   color: #20a060;
}

</style>
