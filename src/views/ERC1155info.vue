<template>
    <div class="container">
 <button v-on:click="updateGraph()" class="update">Update</button>
    <br>
     <div v-if="errors.length!==0">
      OOPS... Something went wrong... Check the console for more info<br>
      <div v-for="error in errors" :key="error.message">
        {{error.message}}
      </div>
    </div>
    <button class="sort-button" v-on:click="nextSort">Sort: {{sortMethod}}</button>
        <button class="switch_axis" v-on:click="switchYAxis()"> <div v-if="currentAxis">$</div><div v-else>GHST</div> </button>
    <br>
      <div class="wrapper" id="wrapper">
      <button v-for="ERC1155 in ERC1155List" :class="{
           common: ERC1155.rarityScoreModifier===1,
           uncommon: ERC1155.rarityScoreModifier===2,
           rare: ERC1155.rarityScoreModifier===5,
           legendary: ERC1155.rarityScoreModifier===10,
           mythical: ERC1155.rarityScoreModifier===20,
           godlike:  ERC1155.rarityScoreModifier===50,
           selectedListing: currentListingSelected===ERC1155.id  }" :id="ERC1155.id" :key="ERC1155.name" class="plate" v-on:click="filterGraph(ERC1155.id)" >
          <button class="favourite" v-on:click="toggleFavorite(ERC1155.id)"><font-awesome-icon  :class="getCurrentFavStatus(ERC1155.id)" :icon="['fas', 'star']"/></button>
        <div class="item-name"><div class="rarity">{{returnRarityString(ERC1155.rarityScoreModifier)}} </div> <div class="name">{{ERC1155.name}}<br> Traded: {{returnLiquidityForItem(ERC1155.name)}} time(s) <span v-if="isWearable!==3"><br>Total Quantity: {{ERC1155.maxQuantity}}</span></div></div>
      </button>
   </div>
     <chart  v-bind:chartData="chartData" v-bind:options="options" class="chart"/>
     <div class="links-wrapper">
      <a class="link" :href='`https://aavegotchi.com/baazaar/erc1155/${listing.id}`' v-for="listing in ERC1155ListingsFiltered" :key="listing.id" target="_blank">
      {{(toEther(listing.priceInWei))}} GHST, ${{(toEther(listing.priceInWei)*currentPrice).toFixed(2)}}, {{listing.quantity}}Item(s) <br>
     </a>
     </div>
    </div>
</template>

<script>
import { ethers } from 'ethers'
import { mapState } from 'vuex'
import store from '../store/index.js'
import Chart from '../components/Chart.vue'

function toDateTime (secs) {
  const t = new Date(1970, 0, 1)
  secs -= t.getTimezoneOffset() * 60
  t.setSeconds(secs)
  return t
}

export default {
  props: { isWearable: Number },
  store,
  name: 'ERC1155',
  components: { Chart },
  computed: {
    ...mapState({
      ERC1155List: 'ERC1155List',
      ERC1155Graph: 'ERC1155Graph',
      ERC1155Listings: 'ERC1155Listings',
      errors: 'errors',
      GHSTprices: 'GHSTprices'
    })
  },
  mounted () {
    window.onkeydown = function (e) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.view.event.preventDefault()
      }
    }
    this.wrapper = document.getElementById('wrapper')
    this.wrapperHeight = this.wrapper.offsetHeight * 0.4
    document.addEventListener('keydown', this.keyDown)
    document.addEventListener('keyup', this.keyUp)
  },
  data () {
    return {
      chartData: {},
      options: {},
      priceForERC1155: [],
      prices: [],
      currentPrice: 0,
      priceForERC1155Filtered: [],
      ERC1155ListingsFiltered: [],
      sortMethod: 'Alphabetically',
      liquidity: [],
      currentListingSelected: -1,
      currentAxis: false,
      maxPrice: 0,
      arrowKeyPressed: false,
      wrapper: null,
      wrapperHeight: 0
    }
  },
  created () {
    this.getERC1155List()
    this.getERC1155Listings()
    this.updateGraph()
  },
  methods: {
    keyUp (event) {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        this.arrowKeyPressed = false
      }
    },
    keyDown (event) {
      if (event.key === 'ArrowUp' && this.arrowKeyPressed === false) {
        const currentIndex = this.ERC1155List.findIndex((a) => a.id === this.currentListingSelected)
        if (this.ERC1155List[currentIndex - 1] !== undefined) {
          this.arrowKeyPressed = true
          this.filterGraph(this.ERC1155List[currentIndex - 1].id)
          const element = document.getElementById(`${this.ERC1155List[currentIndex - 1].id}`)
          const top = element.offsetTop - this.wrapperHeight
          this.wrapper.scrollTo({
            top: top,
            behavior: 'smooth'
          })
          setTimeout(() => { this.arrowKeyPressed = false }, 120)
        }
      } else if (event.key === 'ArrowDown' && this.arrowKeyPressed === false) {
        const currentIndex = this.ERC1155List.findIndex((a) => a.id === this.currentListingSelected)
        if (this.ERC1155List[currentIndex + 1] !== undefined) {
          this.arrowKeyPressed = true
          this.filterGraph(this.ERC1155List[currentIndex + 1].id)
          const element = document.getElementById(`${this.ERC1155List[currentIndex + 1].id}`)
          const top = element.offsetTop - this.wrapperHeight
          this.wrapper.scrollTo({
            top: top,
            behavior: 'smooth'
          })
          setTimeout(() => { this.arrowKeyPressed = false }, 120)
        }
      }
    },
    toEther (wei) {
      return parseFloat(ethers.utils.formatEther(wei)).toFixed(2)
    },
    returnRarityString (rarity) {
      if (rarity === 1) {
        return 'Common'
      } else if (rarity === 2) {
        return 'Uncommon'
      } else if (rarity === 5) {
        return 'Rare'
      } else if (rarity === 10) {
        return 'Legendary'
      } else if (rarity === 20) {
        return 'Mythical'
      } else if (rarity === 50) {
        return 'Godlike'
      }
      return 'undefined'
    },
    getCurrentFavStatus (id) {
      const currentFavouriteStatus = localStorage.getItem(`{id:${id},category:${this.isWearable}`)
      if (currentFavouriteStatus === null || currentFavouriteStatus === undefined) {
        localStorage.setItem(`{id:${id},category:${this.isWearable}`, false)
        return 'not-fav'
      } else if (currentFavouriteStatus === 'false') {
        return 'not-fav'
      } else if (currentFavouriteStatus === 'true') {
        return 'fav'
      }
    },
    toggleFavorite (id) {
      const currentFavouriteStatus = localStorage.getItem(`{id:${id},category:${this.isWearable}`)
      if (currentFavouriteStatus === null || currentFavouriteStatus === undefined) {
        localStorage.setItem(`{id:${id},category:${this.isWearable}`, false)
        return
      }
      const isTrue = (currentFavouriteStatus === 'true')
      localStorage.setItem(`{id:${id},category:${this.isWearable}`, !isTrue)
    },
    returnLiquidityForItem (name) {
      var liquidityItem = this.liquidity.find((a) => a.name === name)
      return `${liquidityItem ? liquidityItem.liquidityValue : 0}`
    },
    async getERC1155Listings () {
      await this.$store.dispatch('fetchERC1155Listing', this.isWearable).then(() => {
        console.log(`Listing length: ${this.ERC1155Listings.length}`)
        this.ERC1155ListingsFiltered = this.ERC1155Listings.sort((a, b) => {
          if (ethers.BigNumber.from(a.priceInWei).lt(b.priceInWei)) {
            return -1
          }
          return 1
        })
      })
    },
    async getERC1155List () {
      if (this.ERC1155List !== []) {
        await this.$store.dispatch('fetchERC1155List', this.isWearable)
          .then(() => {
            this.sortERC1155List()
          })
      }
    },
    nextSort () {
      if (this.sortMethod === 'Alphabetically') {
        this.sortMethod = 'by Rarity'
      } else if (this.sortMethod === 'by Rarity') {
        this.sortMethod = 'by Liquidity'
      } else if (this.sortMethod === 'by Liquidity') {
        this.sortMethod = 'Favourite'
      } else {
        this.sortMethod = 'Alphabetically'
      }
      this.sortERC1155List()
    },
    sortERC1155List () {
      if (this.sortMethod === 'by Rarity') {
        this.ERC1155List.sort((a, b) => {
          if (a.rarityScoreModifier < b.rarityScoreModifier) {
            return 1
          } else if (a.rarityScoreModifier === b.rarityScoreModifier) {
            if (a.name < b.name) {
              return -1
            }
            return 1
          }
          return -1
        })
      } else if (this.sortMethod === 'by Liquidity') {
        this.ERC1155List.sort((a, b) => {
          var item1LiquidityValue = parseInt(this.returnLiquidityForItem(a.name), 10)
          var item2LiquidityValue = parseInt(this.returnLiquidityForItem(b.name), 10)
          if (item1LiquidityValue < item2LiquidityValue) {
            return 1
          }
          return -1
        })
      } else if (this.sortMethod === 'Favourite') {
        this.ERC1155List.sort((a, b) => {
          var favItem1 = localStorage.getItem(`{id:${a.id},category:${this.isWearable}`)
          var favItem2 = localStorage.getItem(`{id:${b.id},category:${this.isWearable}`)
          if (favItem1 === 'true' && favItem2 === 'false') {
            return -1
          }
          return 1
        })
      } else {
        this.ERC1155List.sort((a, b) => {
          if (a.name < b.name) {
            return -1
          }
          return 1
        })
      }
      const currentIndex = this.ERC1155List.findIndex((a) => a.id === this.currentListingSelected)
      if (currentIndex !== -1) {
        requestAnimationFrame(() => {
          const element = document.getElementById(`${this.ERC1155List[currentIndex].id}`)
          element.scrollIntoView({ block: 'center', behavior: 'smooth' })
        })
      }
    },
    filterGraph (id) {
      this.currentListingSelected = id
      this.currentAxis = false
      this.priceForERC1155Filtered = this.priceForERC1155.filter((x) => x.id === id)
      this.updateGraphComponent(`${this.ERC1155List.find((obj) => obj.id === id).name}`)
      this.ERC1155ListingsFiltered = this.ERC1155Listings.filter((x) => x.erc1155TypeId === id)
    },
    getLiquidities () {
      this.liquidity = []
      for (var i = 0; i < this.ERC1155List.length; i++) {
        var itemLiquidityValue = this.priceForERC1155.filter((a) =>
          this.ERC1155List[i].name === a.name
        ).length
        this.liquidity.push({ name: this.ERC1155List[i].name, liquidityValue: itemLiquidityValue })
      }
    },
    async updateGraph () {
      this.$Progress.start()
      this.priceForERC1155 = []
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
      this.currentPrice = this.prices[this.prices.length - 1] ? this.prices[this.prices.length - 1][1] : 0
      await this.$store.dispatch('fetchERC1155Graph', this.isWearable)
        .then(() => {
          for (var i = 0; i < this.ERC1155Graph.length; i++) {
            const day = Math.floor(this.ERC1155Graph[i].timeLastPurchased / 86400) * 86400
            const price = this.prices.find((obj) => { return obj[0] * 0.001 === day })
            this.priceForERC1155.push(this.currentAxis ? { x: toDateTime(this.ERC1155Graph[i].timeLastPurchased), y: (ethers.utils.formatEther(this.ERC1155Graph[i].priceInWei) * (price ? price[1] : this.currentPrice)).toFixed(2), GHST: ethers.utils.formatEther(this.ERC1155Graph[i].priceInWei), id: this.ERC1155Graph[i].erc1155TypeId, name: this.ERC1155List.find((obj) => obj.id === this.ERC1155Graph[i].erc1155TypeId).name }
              : { x: toDateTime(this.ERC1155Graph[i].timeLastPurchased), y: ethers.utils.formatEther(this.ERC1155Graph[i].priceInWei), GHST: (ethers.utils.formatEther(this.ERC1155Graph[i].priceInWei) * (price ? price[1] : this.currentPrice)).toFixed(2), id: this.ERC1155Graph[i].erc1155TypeId, name: this.ERC1155List.find((obj) => obj.id === this.ERC1155Graph[i].erc1155TypeId).name })
            if (parseFloat(this.priceForERC1155[i].y) > this.maxPrice) {
              this.maxPrice = this.priceForERC1155[i].y
            }
          }
          let graphName = ''
          if (this.currentListingSelected < 0) {
            if (this.isWearable === 0) {
              graphName = 'Wearable Prices'
            } else if (this.isWearable === 2) {
              graphName = 'Consumable Prices'
            } else {
              graphName = 'Ticket Prices'
            }
            this.priceForERC1155Filtered = this.priceForERC1155
          } else {
            graphName = `${this.ERC1155List.find((obj) => obj.id === this.currentListingSelected).name}`
            this.priceForERC1155Filtered = this.priceForERC1155.filter((x) => x.id === this.currentListingSelected)
          }
          this.getLiquidities()
          this.updateGraphComponent(graphName)
          this.sortERC1155List()
          this.$Progress.finish()
        }).catch(() => {
          this.$Progress.finish()
        })
    },
    switchYAxis () {
      if (this.chartData.datasets[0] !== undefined) {
        this.currentAxis = !this.currentAxis
        for (var i = 0; i < this.priceForERC1155Filtered.length; i++) {
          this.priceForERC1155Filtered[i] = { x: this.priceForERC1155Filtered[i].x, y: this.priceForERC1155Filtered[i].GHST, GHST: this.priceForERC1155Filtered[i].y, id: this.priceForERC1155Filtered[i].id, name: this.priceForERC1155Filtered[i].name }
        }
        this.chartData = {
          type: 'scatter',
          datasets: [
            {
              label: this.chartData.datasets[0].label,
              data: this.priceForERC1155Filtered,
              fill: this.chartData.datasets[0].fill,
              borderColor: this.chartData.datasets[0].borderColor,
              borderWidth: this.chartData.datasets[0].borderWidth,
              type: this.chartData.datasets[0].type,
              yAxisID: this.chartData.datasets[0].yAxisID
            }
          ]
        }
      }
    },
    updateGraphComponent (label) {
      this.chartData = {
        type: 'scatter',
        datasets: [
          {
            label: label,
            data: this.priceForERC1155Filtered,
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
                beginAtZero: true,
                autoSkip: false,
                padding: 0,
                callback: (value) => {
                  return this.currentAxis ? `$${value}` : `${value} GHST`
                }
              },
              afterBuildTicks: (chartObj) => {
                var tickArray = []
                tickArray.push(0)
                for (var i = 1; i <= this.maxPrice; i *= 1.7) {
                  tickArray.push(parseInt(i))
                }
                chartObj.ticks = tickArray
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
                this.currentAxis ? `$${tooltipItem.yLabel}` : `$${data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].GHST}`,
                this.currentAxis ? `${data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].GHST} GHST` : `${tooltipItem.yLabel} GHST`,
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
    }

  }
}
</script>

<style scoped>
.update{
  font-size:17px;
  height:30px;
}
.selectedListing{
  box-shadow:  5px 5px 0px;
}
.switch_axis{
  height:30px;
  width:60px;
  float:left;
  position: absolute;
  left:340px;
  z-index:99
}
.not-fav{
 color:#bbbbbb !important;
 transition:0.2s;
}
.fav{
 color:#F5d500 !important;
 transition:0.2s;
}
.favourite{
  position:absolute;
  font-size:20px;
  left:21px;
  margin-top:2px;
  background-color:transparent;
  border:0px;
  outline:0px;
}
.name{
  color:black;
}
.rarity{
font-size:14px;
margin-top:-2px;
margin-bottom:2px;
}
.godlike{
      border: 2px solid rgb(255, 0, 0)  !important;
      background-color: rgb(255, 236, 236)  !important;
      color:rgb(255, 0, 0)
}
.mythical{
      border: 2px solid rgb(255, 150, 255)  !important;
      background-color:  rgb(255, 233, 255)  !important;
      color:rgb(255, 150, 255)
}
.legendary{
      border: 2px solid rgb(255, 195, 107)  !important;
       background-color:  rgb(255, 245, 230)  !important;
       color:rgb(255, 195, 107)
}
.rare{
      border: 2px solid rgb(52, 7, 255) !important;
       background-color: rgb(235, 230, 255) !important;
        color:rgb(52, 7, 255)
}
.uncommon{
      border: 2px solid rgb(51, 186, 204) !important;
       background-color:rgb(230, 252, 255) !important;
        color:rgb(51, 186, 204)
}
.common{
      border: 2px solid rgb(48, 185, 44) !important;
      background-color:rgb(233, 255, 232) !important;
       color:rgb(48, 185, 44)
}
.link{
  margin-right:0;
  margin-left:0;
  padding:0;
  }
.sort-button{
  left:20px;
  margin-top:0px;
 position: absolute;
  height:40px;
   border: 2px solid black;
   background-color:white;
    border-radius: 5px;
    font-size:16px;
}

.links-wrapper{
 margin-top:25px;
 margin-right:0;
  margin-left:0;
  height:calc(100vh - 260px);
  overflow-y:scroll;
   width:290px;
   padding-left:5px;
   float:left;
   left:0px;
}

.chart{
   width:calc(100vw - 600px);
    height:calc(100vh - 205px);
   left:0px;
   float:left;
   top:0;
   position: relative;
}
.wrapper{
  height:calc(100vh - 260px);
  overflow-y:scroll;
  width:280px;
  position: relative;
  float:left;
  top:25px;
}
.item-name{
  margin-top:1px;
  font-size:19px
}
.plate{
    transition:0.2s;
  width:230px;
  height:90px;
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
   color: #0088cc;
}

</style>
