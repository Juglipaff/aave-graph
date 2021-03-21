import { ethers } from 'ethers'
// import Web3 from 'web3'

import Vue from 'vue'
import Vuex from 'vuex'
import abi from '@/diamond.json'
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

function getAavegotchiContract () {
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  const provider = new ethers.providers.JsonRpcProvider('https://rpc-mainnet.matic.network/')
  const diamond = new ethers.Contract(aavegotchiDiamondAddress, abi, provider)
  return diamond
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

async function getGotchiPricesAndRarity (blocksShown) {
  const diamond = getAavegotchiContract()
  var dataArray = []
  var promises = []
  var results = []
  results = await diamond.getERC721Listings(3, 'purchased', blocksShown.blocksShown)
    .catch((err) => {
      console.log(err)
    })
  for (var i = 0; i < results.length; i++) {
    dataArray.push({ y: parseInt(results[i].priceInWei._hex, 16) * 0.000000000000000001, x: parseInt(results[i].timePurchased._hex, 16), rarity: 0 })
    const localItem = localStorage.getItem(JSON.stringify({ id: results[i].erc721TokenId._hex, category: 3 }))
    if (localItem === null || localItem === undefined) {
      console.log('the key was not found in the cache')
      promises.push(diamond.getAavegotchi(parseInt(results[i].erc721TokenId._hex, 16)))
      continue
    }
    promises.push({ modifiedRarityScore: { _hex: localItem }, localStorage: true })
  }

  await Promise.allSettled(promises).then(values => {
    for (var i = 0; i < values.length; i++) {
      if (values[i].status === 'fulfilled') {
        dataArray[i].rarity = parseInt(values[i].value.modifiedRarityScore._hex, 16)
        if (values[i].value.localStorage !== true) {
          localStorage.setItem(JSON.stringify({ id: values[i].value.tokenId._hex, category: 3 }), values[i].value.modifiedRarityScore._hex)
        }
      }
    }
  })

  return dataArray
}
// Closed portals

async function getClosedPortalPrices (blocksShown) {
  const diamond = getAavegotchiContract()
  var dataArray = []
  var results = []
  results = await diamond.getERC721Listings(0, 'purchased', blocksShown.blocksShown)
    .catch((err) => {
      console.log(err)
    })
  for (var i = 0; i < results.length; i++) {
    dataArray.push({ y: parseInt(results[i].priceInWei._hex, 16) * 0.000000000000000001, x: parseInt(results[i].timePurchased._hex, 16) })
  }
  return dataArray
}

async function getClosedPortalListings () {
  const diamond = getAavegotchiContract()
  var listingInfo = []
  listingInfo = await diamond.getERC721Listings(0, 'listed', 2000)
    .catch((err) => {
      console.log(err)
    })
  var listings = []
  for (let i = 0; i < listingInfo.length; i++) {
    listings.push({ link: `https://aavegotchi.com/baazaar/erc721/${parseInt(listingInfo[i].listingId._hex)}`, price: parseInt(listingInfo[i].priceInWei._hex) * 0.000000000000000001 })
  }
  console.log(`Listing length: ${listings.length} items`)
  return listings
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
// Wearable items
async function getWearablePrices () {
  const graphQuery = `{
    erc1155Listings(first: 1000, orderBy:timeLastPurchased,orderDirection: desc,where:{category:"0",sold:true}) {
      priceInWei
      timeLastPurchased
      erc1155TypeId
    }
  }`
  const wearablePriceList = await sendGraphRequest(graphQuery)
    .catch((err) => { console.log(err) })
  return wearablePriceList.data.erc1155Listings
}

async function getWearableListings () {
  const graphQuery = `{
    erc1155Listings(first: 1000, where:{category:"0", cancelled:false, sold:false}) {
      priceInWei
      id
      erc1155TypeId
      quantity
    }
  }`
  const wearableListings = await sendGraphRequest(graphQuery)
    .catch((err) => { console.log(err) })
  return wearableListings.data.erc1155Listings
}

async function getWearableList () {
  const ERC1155List = await getERC1155List()
    .catch((err) => {
      console.log(err)
    })
  var consumableIds = []
  var consumableList = []
  for (let i = 0; i < 126; i++) {
    consumableIds.push(i)
  }
  for (let i = 0; i < ERC1155List.length; i++) {
    if (consumableIds.some((a) => parseInt(ERC1155List[i].id) === a)) {
      consumableList.push(ERC1155List[i])
    }
  }
  return consumableList
}

// Consumable items
async function getConsumableList () {
  const ERC1155List = await getERC1155List()
    .catch((err) => {
      console.log(err)
    })
  var consumableIds = []
  var consumableList = []
  for (let i = 126; i < 130; i++) {
    consumableIds.push(i)
  }
  for (let i = 0; i < ERC1155List.length; i++) {
    if (consumableIds.some((a) => parseInt(ERC1155List[i].id) === a)) {
      consumableList.push(ERC1155List[i])
    }
  }
  return consumableList
}
async function getConsumableListings () {
  const graphQuery = `{
    erc1155Listings(first: 1000, where:{category:"2", cancelled:false, sold:false}) {
      priceInWei
      id
      erc1155TypeId
      quantity
    }
  }`
  const consumableListings = await sendGraphRequest(graphQuery)
    .catch((err) => { console.log(err) })
  return consumableListings.data.erc1155Listings
}
async function getConsumablePrices () {
  const graphQuery = `{
    erc1155Listings(first: 1000,orderBy:timeLastPurchased,orderDirection: desc, where:{category:"2",sold:true}) {
      priceInWei
      timeLastPurchased
      erc1155TypeId
    }
  }`
  const consumablePriceList = await sendGraphRequest(graphQuery)
    .catch((err) => { console.log(err) })
  return consumablePriceList.data.erc1155Listings
}

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    gotchiGraph: [],
    closedPortalGraph: [],
    openPortalGraph: [],
    closedPortalListings: [],
    wearableList: [],
    wearableGraph: [],
    wearablesListings: [],
    consumableList: [],
    consumablesListings: [],
    consumablesGraph: [],
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
    SET_WEARABLES_LIST (state, wearableList) {
      state.wearableList = wearableList
      state.errors = []
    },
    SET_WEARABLES_GRAPH (state, wearableGraph) {
      state.wearableGraph = wearableGraph
      state.errors = []
    },
    SET_WEARABLES_LISTINGS (state, listingData) {
      state.wearablesListings = listingData
      state.errors = []
    },
    SET_CONSUMABLES_LIST (state, consumableList) {
      state.consumableList = consumableList
      state.errors = []
    },
    SET_CONSUMABLES_LISTINGS (state, listingData) {
      state.consumablesListings = listingData
      state.errors = []
    },
    SET_CONSUMABLES_GRAPH (state, consumableGraph) {
      state.consumablesGraph = consumableGraph
      state.errors = []
    },
    SET_CLOSED_PORTALS_QUANTITY (state, Balance) {
      state.closedPortalsQuantity = Balance
      state.errors = []
    },
    SET_ERRORS (state, errorData) {
      state.errors = errorData
    }
  },
  actions: {
    fetchGraph ({ commit }, blocksShown) {
      return getGotchiPricesAndRarity(blocksShown).then(response => {
        commit('SET_GOTCHI_GRAPH', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
      })
    },
    fetchPortalGraph ({ commit }, blocksShown) {
      return getClosedPortalPrices(blocksShown).then(response => {
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
    fetchWearablesList ({ commit }) {
      return getWearableList().then(response => {
        commit('SET_WEARABLES_LIST', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
      })
    },
    fetchWearablesGraph ({ commit }) {
      return getWearablePrices().then(response => {
        commit('SET_WEARABLES_GRAPH', response)
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
    fetchWearablesListing ({ commit }) {
      return getWearableListings().then(response => {
        commit('SET_WEARABLES_LISTINGS', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
      })
    },
    fetchConsumablesList ({ commit }) {
      return getConsumableList().then(response => {
        commit('SET_CONSUMABLES_LIST', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
      })
    },
    fetchConsumablesListing ({ commit }) {
      return getConsumableListings().then(response => {
        commit('SET_CONSUMABLES_LISTINGS', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
      })
    },
    fetchConsumablesGraph ({ commit }) {
      return getConsumablePrices().then(response => {
        commit('SET_CONSUMABLES_GRAPH', response)
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
    }
  }
})
