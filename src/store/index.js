import { ethers } from 'ethers'
// import Web3 from 'web3'
import abi from '../premiumAddresses.json'
import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

window.ethereum.on('chainChanged', (_chainId) => {
  window.location.reload()
})

let currentAccount = ''
window.ethereum.on('accountsChanged', (accounts) => {
  if (accounts.length === 0) {
    store.dispatch('setIsRegisteredFalse')
      .catch((err) => {
        console.log(err)
      })
  } else if (accounts[0] !== currentAccount) {
    store.dispatch('fetchIsRegistered')
      .catch((err) => {
        console.log(err)
      })
  }
})

async function login () {
  await window.ethereum.request({ method: 'eth_requestAccounts' })
    .then((accounts) => {
      currentAccount = accounts[0]
    })
    .catch((err) => {
      console.log(err)
    })
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const contractAddress = '0xb17fC75fc6e054EdA65c32B5a0c26187Dd62955f'
  const contract = new ethers.Contract(contractAddress, abi, provider)
  const signer = provider.getSigner()
  const currentAddress = await signer.getAddress().catch((err) => {
    console.log(err)
  })
  const isRegistered = await contract.registeredAddresses(currentAddress)
    .catch((err) => {
      console.log(err)
    })
  console.log(isRegistered)
  return isRegistered
}

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
  const graphQuery = `{
    statistic (id:0){
      portalsOpened
    }
    }`
  const portalsOpened = await sendGraphRequest(graphQuery)
    .catch((err) => { console.log(err) })
  return (10000 - parseInt(portalsOpened.data.statistic.portalsOpened))
}

async function getCurrentPriceGHST () {
  const price = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=aavegotchi&vs_currencies=usd')
    .catch((error) => {
      console.log(error)
    })
  return parseFloat(price.data.aavegotchi.usd)
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
  var dataArray = []
  var length = 1000
  var i = 0
  while (length === 1000 && i < 6) {
    const graphQuery = `{
    erc721Listings(first:1000,skip:${i * 1000},orderDirection:desc,orderBy:timePurchased,where:{category:2,timePurchased_not:"0"})
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
    i += 1
    const openPortalsPrices = await sendGraphRequest(graphQuery)
      .catch((err) => { console.log(err) })
    length = openPortalsPrices.data.erc721Listings.length
    dataArray = dataArray.concat(openPortalsPrices.data.erc721Listings)
  }
  console.log(`Points got: ${dataArray.length}`)
  return dataArray
}

// Gotchi

async function getGotchiPricesAndRarity () {
  // const GotchiInfo =[]
  var dataArray = []
  var length = 1000
  var i = 0
  while (length === 1000 && i < 6) {
    const graphQuery = `{
    erc721Listings(first:1000,skip:${i * 1000},orderDirection:desc,orderBy:timePurchased,where:{category:3,timePurchased_not:"0"})
    {
      priceInWei
      timePurchased
      gotchi{
        modifiedRarityScore
      }
    }
  }`
    i += 1
    const gotchiPrices = await sendGraphRequest(graphQuery)
      .catch((err) => { console.log(err) })
    length = gotchiPrices.data.erc721Listings.length
    dataArray = dataArray.concat(gotchiPrices.data.erc721Listings)
  }
  console.log(`Points got: ${dataArray.length}`)
  return dataArray
}
// Closed portals

async function getClosedPortalPrices () {
  var dataArray = []
  var length = 1000
  var i = 0
  while (length === 1000 && i < 6) {
    const graphQuery = `{
    erc721Listings(first:1000,skip:${i * 1000},orderDirection:desc,orderBy:timePurchased,where:{category:0,timePurchased_not:"0"})
    {
      priceInWei
      timePurchased
    }
  }`
    i += 1
    const closedPortalPrices = await sendGraphRequest(graphQuery)
      .catch((err) => { console.log(err) })
    length = closedPortalPrices.data.erc721Listings.length
    dataArray = dataArray.concat(closedPortalPrices.data.erc721Listings)
  }
  console.log(`Points got: ${dataArray.length}`)
  return dataArray
}

async function getClosedPortalListings () {
  var dataArray = []
  var length = 1000
  var i = 0
  while (length === 1000 && i < 6) {
    const graphQuery = `{
    erc721Listings(first:1000,skip:${i * 1000},orderBy:timeCreated,orderDirection:desc,where:{category:0,timePurchased:"0",cancelled:false})
    {
      priceInWei
      id
    }
  }`
    i += 1
    const closedPortalListings = await sendGraphRequest(graphQuery)
      .catch((err) => { console.log(err) })
    length = closedPortalListings.data.erc721Listings.length
    dataArray = dataArray.concat(closedPortalListings.data.erc721Listings)
  }
  return dataArray
}

// ERC1155

async function getERC1155List (isWearable) {
  if (isWearable !== 3) {
    const graphQuery = `{
    itemTypes(first:1000,where:{category:${isWearable}}) {
      name
      id
      rarityScoreModifier
      maxQuantity
    }
  }`
    const list = await sendGraphRequest(graphQuery)
      .catch((err) => { console.log(err) })
    return list.data.itemTypes
  }
  const list = {
    data: {
      itemTypes: [
        {
          id: '0',
          maxQuantity: '500',
          name: 'Ticket - Common',
          rarityScoreModifier: 1
        },
        {
          id: '1',
          maxQuantity: '250',
          name: 'Ticket - Uncommon',
          rarityScoreModifier: 2
        },
        {
          id: '2',
          maxQuantity: '500',
          name: 'Ticket - Rare',
          rarityScoreModifier: 5
        },
        {
          id: '3',
          maxQuantity: '250',
          name: 'Ticket - Legendary',
          rarityScoreModifier: 10
        },
        {
          id: '4',
          maxQuantity: '500',
          name: 'Ticket - Mythical',
          rarityScoreModifier: 20
        },
        {
          id: '5',
          maxQuantity: '250',
          name: 'Ticket - Godlike',
          rarityScoreModifier: 50
        }
      ]
    }
  }
  return list.data.itemTypes
}
async function getERC1155Prices (isWearable) {
  var dataArray = []
  var length = 1000
  var i = 0
  while (length === 1000 && i < 6) {
    const graphQuery = `{
    erc1155Listings(first: 1000,skip:${i * 1000}, orderBy:timeLastPurchased,orderDirection: desc,where:{category:"${isWearable}",sold:true}) {
      priceInWei
      timeLastPurchased
      erc1155TypeId
    }
  }`
    i += 1
    const ERC1155PriceList = await sendGraphRequest(graphQuery)
      .catch((err) => { console.log(err) })
    length = ERC1155PriceList.data.erc1155Listings.length
    dataArray = dataArray.concat(ERC1155PriceList.data.erc1155Listings)
  }
  console.log(`Points got: ${dataArray.length}`)
  return dataArray
}

async function getERC1155Listings (isWearable) {
  var dataArray = []
  var length = 1000
  var i = 0
  while (length === 1000 && i < 6) {
    const graphQuery = `{
    erc1155Listings(first: 1000,skip:${i * 1000}, orderBy:timeCreated,orderDirection:desc,where:{category:"${isWearable}", cancelled:false, sold:false}) {
      priceInWei
      id
      erc1155TypeId
      quantity
    }
  }`
    i += 1
    const ERC1155Listings = await sendGraphRequest(graphQuery)
      .catch((err) => { console.log(err) })
    length = ERC1155Listings.data.erc1155Listings.length
    dataArray = dataArray.concat(ERC1155Listings.data.erc1155Listings)
  }

  return dataArray
}

Vue.use(Vuex)
const store = new Vuex.Store({
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
    CurrentGHSTprice: 0,
    user: null,
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
    SET_CURRENT_GHST_PRICE (state, price) {
      state.CurrentGHSTprice = price
      state.errors = []
    },
    SET_USER_DATA (state, user) {
      state.user = user
      state.errors = []
    },
    SET_ERRORS (state, errorData) {
      state.errors = []
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
      return getERC1155List(isWearable).then(response => {
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
    },
    fetchCurentGHSTPrice ({ commit }) {
      return getCurrentPriceGHST().then(response => {
        commit('SET_CURRENT_GHST_PRICE', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
      })
    },
    fetchIsRegistered ({ commit }) {
      return login().then(response => {
        commit('SET_USER_DATA', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
      })
    },
    setIsRegisteredFalse ({ commit }) {
      commit('SET_USER_DATA', null)
    }

  }
})
export default store
