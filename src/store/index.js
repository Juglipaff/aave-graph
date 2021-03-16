import { ethers } from 'ethers'
// import Web3 from 'web3'

import Vue from 'vue'
import Vuex from 'vuex'
import abi from '@/diamond.json'

function getAavegotchiContract () {
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  const provider = new ethers.providers.JsonRpcProvider('https://rpc-mainnet.matic.network/')
  const diamond = new ethers.Contract(aavegotchiDiamondAddress, abi, provider)
  return diamond
}

// Open portals

async function getOpenPortalPricesAndRarity (blocksShown) {
  const diamond = getAavegotchiContract()
  var dataArray = []
  var returnArray = []
  var promises = []
  const results = await diamond.getERC721Listings(2, 'purchased', blocksShown.blocksShown)
  for (var i = 0; i < results.length; i++) {
    dataArray.push({ y: parseInt(results[i].priceInWei._hex, 16) * 0.000000000000000001, x: parseInt(results[i].timePurchased._hex, 16), rarity: 0, id: results[i].erc721TokenId._hex })
    const localItem = localStorage.getItem(JSON.stringify({ id: results[i].erc721TokenId._hex, category: 2 }))
    if (localItem === null || localItem === undefined) {
      console.log('the key was not found in the cache')
      promises.push(diamond.portalAavegotchiTraits(parseInt(results[i].erc721TokenId._hex, 16)))
      continue
    }
    promises.push({ value: localItem, localStorage: true })
  }

  await Promise.allSettled(promises).then(values => {
    for (var i = 0; i < values.length; i++) {
      if (values[i].status === 'fulfilled') {
        if (values[i].value.localStorage === true) {
          if (values[i].value.value !== '0') {
            returnArray.push({ y: dataArray[i].y, x: dataArray[i].x, rarity: values[i].value.value })
          }
          continue
        }
        var maxBRS = 0
        for (var n = 0; n < values[i].value.length; n++) {
          var BRS = 0
          for (var k = 0; k < 6; k++) {
            const traitValue = values[i].value[n].numericTraits[k]
            BRS += traitValue >= 50 ? traitValue : 100 - traitValue
          }
          if (maxBRS < BRS) {
            maxBRS = BRS
          }
        }
        returnArray.push({ y: dataArray[i].y, x: dataArray[i].x, rarity: maxBRS })
        localStorage.setItem(JSON.stringify({ id: dataArray[i].id, category: 2 }), maxBRS)
        continue
      }
      localStorage.setItem(JSON.stringify({ id: dataArray[i].id, category: 2 }), 0)
    }
  })
  return returnArray
}

// Gotchi

async function getGotchiPricesAndRarity (blocksShown) {
  const diamond = getAavegotchiContract()
  var dataArray = []
  var promises = []
  const results = await diamond.getERC721Listings(3, 'purchased', blocksShown.blocksShown)

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

  await Promise.all(promises).then(values => {
    for (var i = 0; i < values.length; i++) {
      dataArray[i].rarity = parseInt(values[i].modifiedRarityScore._hex, 16)
      if (values[i].localStorage !== true) {
        localStorage.setItem(JSON.stringify({ id: values[i].tokenId._hex, category: 3 }), values[i].modifiedRarityScore._hex)
      }
    }
  })
  return dataArray
}

// Closed portals

async function getClosedPortalPrices (blocksShown) {
  const diamond = getAavegotchiContract()
  var dataArray = []
  const results = await diamond.getERC721Listings(0, 'purchased', blocksShown.blocksShown)
  for (var i = 0; i < results.length; i++) {
    dataArray.push({ y: parseInt(results[i].priceInWei._hex, 16) * 0.000000000000000001, x: parseInt(results[i].timePurchased._hex, 16) })
  }
  return dataArray
}

async function getClosedPortalListings () {
  const diamond = getAavegotchiContract()
  const listingInfo = await diamond.getERC721Listings(0, 'listed', 8000)
  var listings = []
  for (let i = 0; i < listingInfo.length; i++) {
    listings.push({ link: `https://aavegotchi.com/baazaar/erc721/${parseInt(listingInfo[i].listingId._hex)}`, price: parseInt(listingInfo[i].priceInWei._hex) * 0.000000000000000001 })
  }
  console.log(`Listing length: ${listings.length} items`)
  return listings
}

// Wearable items

async function getWearableListings (blocksShown) {
  const diamond = getAavegotchiContract()
  const listingInfo = await diamond.getERC1155Listings(0, 'listed', blocksShown.blocksShown)
  var listings = []
  for (let i = 0; i < listingInfo.length; i++) {
    listings.push({ link: `https://aavegotchi.com/baazaar/erc1155/${parseInt(listingInfo[i].listingId._hex)}`, price: parseInt(listingInfo[i].priceInWei._hex) * 0.000000000000000001, id: parseInt(listingInfo[i].erc1155TypeId._hex, 16), quantity: parseInt(listingInfo[i].quantity._hex, 16) })
  }
  console.log(`Listing length: ${listings.length} items`)
  return listings
}

async function getWearablePrices (blocksShown) {
  const diamond = getAavegotchiContract()
  const wearablePriceList = await diamond.getERC1155Listings(0, 'purchased', blocksShown.blocksShown)

  var wearablePrices = []
  for (let i = 0; i < wearablePriceList.length; i++) {
    wearablePrices.push({ y: parseInt(wearablePriceList[i].priceInWei._hex, 16) * 0.000000000000000001, x: parseInt(wearablePriceList[i].timeLastPurchased._hex, 16), id: parseInt(wearablePriceList[i].erc1155TypeId._hex, 16) })
  }
  return wearablePrices
}

async function getWearableList () {
  const diamond = getAavegotchiContract()
  var items = []
  var wearables = []
  for (var k = 0; k <= 125; k++) {
    items.push(k)
  }
  await diamond.getItemTypes(items).then((values) => {
    for (var i = 0; i < values.length; i++) {
      if (!wearables.some(obj => obj.name === values[i].name && obj.id === values[i].svgId)) {
        wearables.push({ name: values[i].name, id: values[i].svgId, rarity: values[i].rarityScoreModifier, quantity: parseInt(values[i].totalQuantity._hex, 16) })
      }
    }
  })
  return wearables
}

// Consumable items

async function getConsumableList () {
  const diamond = getAavegotchiContract()
  var items = []
  var dataArray = []
  for (var i = 126; i < 130; i++) {
    items.push(i)
  }
  await diamond.getItemTypes(items).then((values) => {
    for (var i = 0; i < values.length; i++) {
      dataArray.push({ name: values[i].name, id: values[i].svgId, rarity: values[i].rarityScoreModifier, quantity: parseInt(values[i].totalQuantity._hex, 16) })
    }
  })
  return dataArray
}
async function getConsumableListings (blocksShown) {
  const diamond = getAavegotchiContract()
  const listingInfo = await diamond.getERC1155Listings(2, 'listed', blocksShown.blocksShown)
  var listings = []
  for (let i = 0; i < listingInfo.length; i++) {
    listings.push({ link: `https://aavegotchi.com/baazaar/erc1155/${parseInt(listingInfo[i].listingId._hex)}`, price: parseInt(listingInfo[i].priceInWei._hex) * 0.000000000000000001, id: parseInt(listingInfo[i].erc1155TypeId._hex, 16), quantity: parseInt(listingInfo[i].quantity._hex, 16) })
  }
  console.log(`Listing length: ${listings.length} items`)
  return listings
}
async function getConsumablePrices (blocksShown) {
  const diamond = getAavegotchiContract()
  const consumablePriceList = await diamond.getERC1155Listings(2, 'purchased', blocksShown.blocksShown)
  var consumablePrices = []
  for (let i = 0; i < consumablePriceList.length; i++) {
    consumablePrices.push({ y: parseInt(consumablePriceList[i].priceInWei._hex, 16) * 0.000000000000000001, x: parseInt(consumablePriceList[i].timeLastPurchased._hex, 16), id: parseInt(consumablePriceList[i].erc1155TypeId._hex, 16) })
  }
  return consumablePrices
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
        throw error
      })
    },
    fetchPortalGraph ({ commit }, blocksShown) {
      return getClosedPortalPrices(blocksShown).then(response => {
        commit('SET_CLOSED_PORTAL_GRAPH', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
        throw error
      })
    },
    fetchOpenPortalGraph ({ commit }, blocksShown) {
      return getOpenPortalPricesAndRarity(blocksShown).then(response => {
        commit('SET_OPEN_PORTAL_GRAPH', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
        throw error
      })
    },
    fetchWearablesList ({ commit }) {
      return getWearableList().then(response => {
        commit('SET_WEARABLES_LIST', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
        throw error
      })
    },
    fetchWearablesGraph ({ commit }, blocksShown) {
      return getWearablePrices(blocksShown).then(response => {
        commit('SET_WEARABLES_GRAPH', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
        throw error
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
    fetchWearablesListing ({ commit }, blocksShown) {
      return getWearableListings(blocksShown).then(response => {
        commit('SET_WEARABLES_LISTINGS', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
        throw error
      })
    },
    fetchConsumablesList ({ commit }) {
      return getConsumableList().then(response => {
        commit('SET_CONSUMABLES_LIST', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
        throw error
      })
    },
    fetchConsumablesListing ({ commit }, blocksShown) {
      return getConsumableListings(blocksShown).then(response => {
        commit('SET_CONSUMABLES_LISTINGS', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
        throw error
      })
    },
    fetchConsumablesGraph ({ commit }, blocksShown) {
      return getConsumablePrices(blocksShown).then(response => {
        commit('SET_CONSUMABLES_GRAPH', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
        throw error
      })
    }
  }
})
