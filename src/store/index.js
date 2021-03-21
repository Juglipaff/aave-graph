import { ethers } from 'ethers'
// import Web3 from 'web3'

import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

async function sendGraphRequest (graphQuery) {
  const result = await axios({
    url: 'https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic',
    method: 'post',
    data: {
      query: graphQuery
    }
  }).catch((error) => {
    console.log(error)
  })
  return result.data
}

async function getClosedPortalsQuantity () {
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  const provider = new ethers.providers.JsonRpcProvider('https://rpc-mainnet.matic.network/')
  var minAbi = [{
    constant: !0,
    inputs: [{
      name: '_owner',
      type: 'address'
    }],
    name: 'balanceOf',
    outputs: [{
      name: 'balance',
      type: 'uint256'
    }],
    type: 'function'
  }, {
    constant: !0,
    inputs: [],
    name: 'decimals',
    outputs: [{
      name: '',
      type: 'uint8'
    }],
    type: 'function'
  }]
  const contract = new ethers.Contract('0xb0897686c545045aFc77CF20eC7A532E3120E0F1', minAbi, provider)
  var balance = { _hex: 0 }
  balance = await contract.balanceOf(aavegotchiDiamondAddress)
    .catch((err) => {
      console.log(err)
    })
  return parseInt(balance._hex, 16) * 0.00000000000001
}

async function getHistoricalPricesGHST () {
  const prices = await axios.get('https://api.coingecko.com/api/v3/coins/aavegotchi/market_chart?vs_currency=usd&days=max&interval=daily')
    .catch((error) => {
      console.log(error)
    })
  return prices.data.prices
}
// Open portals

async function getOpenPortalPricesAndRarity () {
  const graphQuery = `{
    erc721Listings(first:1000,orderDirection:desc,orderBy:timePurchased,where:{category:2,timePurchased_not:"0"})
    {
      priceInWei
      timePurchased
      tokenId
      portal{
        options{
          numericTraits
        }
      }
    }
    }`
  const openPortalsPrices = await sendGraphRequest(graphQuery)
    .catch((err) => { console.log(err) })
  return openPortalsPrices.data.erc721Listings
}

// Gotchi

async function getGotchiPricesAndRarity () {
  const graphQuery = `{
  erc721Listings(first:1000,orderDirection:desc,orderBy:timePurchased,where:{category:3,timePurchased_not:"0"})
  {
    priceInWei
    timePurchased
    gotchi{
      modifiedRarityScore
    }
  }
  }`
  const gotchiPrices = await sendGraphRequest(graphQuery)
    .catch((err) => { console.log(err) })
  return gotchiPrices.data.erc721Listings
}
// Closed portals

async function getClosedPortalPrices () {
  const graphQuery = `{
    erc721Listings(first:1000,orderDirection:desc,orderBy:timePurchased,where:{category:0,timePurchased_not:"0"})
    {
      priceInWei
      timePurchased
    }
    }`
  const closedPortalPrices = await sendGraphRequest(graphQuery)
    .catch((err) => { console.log(err) })
  return closedPortalPrices.data.erc721Listings
}

async function getClosedPortalListings () {
  const graphQuery = `{
    erc721Listings(first:1000,orderDirection:desc,orderBy:timePurchased,where:{category:0,timePurchased:"0",cancelled:false})
    {
      priceInWei
      id
    }
  }`
  const closedPortalListings = await sendGraphRequest(graphQuery)
    .catch((err) => { console.log(err) })
  return closedPortalListings.data.erc721Listings
}

// ERC1155

async function getERC1155List () {
  const sessionItem = sessionStorage.getItem('ERC1155')
  if (sessionItem === null || sessionItem === undefined) {
    const graphQuery = `{
    itemTypes(first:1000) {
      name
      id
      rarityScoreModifier
      maxQuantity
    }
  }`
    const list = await sendGraphRequest(graphQuery)
      .catch((err) => { console.log(err) })
    sessionStorage.setItem('ERC1155', JSON.stringify(list.data.itemTypes))
    return list.data.itemTypes
  }
  return JSON.parse(sessionItem)
}
async function getERC1155Prices (isWearable) {
  const graphQuery = `{
    erc1155Listings(first: 1000, orderBy:timeLastPurchased,orderDirection: desc,where:{category:"${isWearable ? 0 : 2}",sold:true}) {
      priceInWei
      timeLastPurchased
      erc1155TypeId
    }
  }`
  const ERC1155PriceList = await sendGraphRequest(graphQuery)
    .catch((err) => { console.log(err) })
  return ERC1155PriceList.data.erc1155Listings
}

async function getERC1155Listings (isWearable) {
  const graphQuery = `{
    erc1155Listings(first: 1000, where:{category:"${isWearable ? 0 : 2}", cancelled:false, sold:false}) {
      priceInWei
      id
      erc1155TypeId
      quantity
    }
  }`
  const ERC1155Listings = await sendGraphRequest(graphQuery)
    .catch((err) => { console.log(err) })
  return ERC1155Listings.data.erc1155Listings
}

async function getERC1155FilteredList (isWearable) {
  const ERC1155List = await getERC1155List()
    .catch((err) => {
      console.log(err)
    })
  var ERC1155Ids = []
  var ERC1155ReturnList = []
  if (isWearable) {
    for (let i = 0; i < 126; i++) {
      ERC1155Ids.push(i)
    }
  } else {
    for (let i = 126; i < 130; i++) {
      ERC1155Ids.push(i)
    }
  }
  for (let i = 0; i < ERC1155List.length; i++) {
    if (ERC1155Ids.some((a) => parseInt(ERC1155List[i].id) === a)) {
      ERC1155ReturnList.push(ERC1155List[i])
    }
  }
  return ERC1155ReturnList
}

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    gotchiGraph: [],
    closedPortalGraph: [],
    openPortalGraph: [],
    closedPortalListings: [],
    ERC1155List: [],
    ERC1155Graph: [],
    ERC1155Listings: [],
    GHSTprices: [],
    closedPortalsQuantity: 0,
    errors: []
  },
  mutations: {
    SET_GOTCHI_GRAPH (state, graphData) {
      state.gotchiGraph = graphData
      state.errors = []
    },
    SET_CLOSED_PORTAL_GRAPH (state, graphData) {
      state.closedPortalGraph = graphData
      state.errors = []
    },
    SET_OPEN_PORTAL_GRAPH (state, graphData) {
      state.openPortalGraph = graphData
      state.errors = []
    },
    SET_CLOSED_PORTALS_LISTINGS (state, listingData) {
      state.closedPortalListings = listingData
      state.errors = []
    },
    SET_ERC1155_LIST (state, ERC1155List) {
      state.ERC1155List = ERC1155List
      state.errors = []
    },
    SET_ERC1155_GRAPH (state, ERC1155Graph) {
      state.ERC1155Graph = ERC1155Graph
      state.errors = []
    },
    SET_ERC1155_LISTINGS (state, listingData) {
      state.ERC1155Listings = listingData
      state.errors = []
    },
    SET_CLOSED_PORTALS_QUANTITY (state, Balance) {
      state.closedPortalsQuantity = Balance
      state.errors = []
    },
    SET_GHST_PRICES (state, prices) {
      state.GHSTprices = prices
      state.errors = []
    },
    SET_ERRORS (state, errorData) {
      state.errors = errorData
    }
  },
  actions: {
    fetchGotchiGraph ({ commit }) {
      return getGotchiPricesAndRarity().then(response => {
        commit('SET_GOTCHI_GRAPH', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
      })
    },
    fetchPortalGraph ({ commit }) {
      return getClosedPortalPrices().then(response => {
        commit('SET_CLOSED_PORTAL_GRAPH', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
      })
    },
    fetchOpenPortalGraph ({ commit }) {
      return getOpenPortalPricesAndRarity().then(response => {
        commit('SET_OPEN_PORTAL_GRAPH', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
      })
    },
    fetchERC1155List ({ commit }, isWearable) {
      return getERC1155FilteredList(isWearable).then(response => {
        commit('SET_ERC1155_LIST', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
      })
    },
    fetchERC1155Graph ({ commit }, isWearable) {
      return getERC1155Prices(isWearable).then(response => {
        commit('SET_ERC1155_GRAPH', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
      })
    },
    fetchClosedPortalListing ({ commit }) {
      return getClosedPortalListings().then(response => {
        commit('SET_CLOSED_PORTALS_LISTINGS', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
        throw error
      })
    },
    fetchERC1155Listing ({ commit }, isWearable) {
      return getERC1155Listings(isWearable).then(response => {
        commit('SET_ERC1155_LISTINGS', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
      })
    },
    fetchClosedPortalQuantity ({ commit }) {
      return getClosedPortalsQuantity().then(response => {
        commit('SET_CLOSED_PORTALS_QUANTITY', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
      })
    },
    fetchGHSTPrices ({ commit }) {
      return getHistoricalPricesGHST().then(response => {
        commit('SET_GHST_PRICES', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
      })
    }
  }
})
