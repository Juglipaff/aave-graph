import { ethers } from 'ethers'
// import Web3 from 'web3'

import Vue from 'vue'
import Vuex from 'vuex'
import abi from '@/diamond.json'

function createContract () {
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  const provider = new ethers.providers.JsonRpcProvider('https://rpc-mainnet.matic.network/')
  const diamond = new ethers.Contract(aavegotchiDiamondAddress, abi, provider)
  return diamond
}
async function portalPrices (blocksShown) {
  const diamond = createContract()
  var dataArray = []
  const results = await diamond.getERC721Listings(0, 'purchased', blocksShown.blocksShown)
  for (var i = 0; i < results.length; i++) {
    dataArray.push({ y: parseInt(results[i].priceInWei._hex, 16) * 0.000000000000000001, x: parseInt(results[i].timePurchased._hex, 16) })
  }
  return dataArray
}

async function gotchiPrices (blocksShown) {
  const diamond = createContract()
  // const filter = diamond.filters.ERC721ExecutedListing()
  // const completedBuys = await diamond.queryFilter(filter, 11516320)
  var dataArray = []
  var promises = []
  /* for (var i = 0; i < results.length; i++) {
    var category = parseInt(results[i].args.category._hex, 16)
    if (isGotchi) {
      promises.push(category === 3 ? diamond.getAavegotchi(parseInt(results[i].args.erc721TokenId._hex, 16)) : Promise.resolve(0))
    }
    dataArray.push({ y: parseInt(results[i].args.priceInWei._hex, 16) * 0.000000000000000001, x: parseInt(results[i].args.time._hex, 16), category: category, rarity: 0 })
  }

  await Promise.all(promises).then(values => {
    for (var i = 0; i < values.length; i++) {
      dataArray[i].rarity = values[i] === 0 ? 0 : parseInt(values[i].modifiedRarityScore._hex, 16)
    }
  }) */
  const results = await diamond.getERC721Listings(3, 'purchased', blocksShown.blocksShown)
  for (var i = 0; i < results.length; i++) {
    dataArray.push({ y: parseInt(results[i].priceInWei._hex, 16) * 0.000000000000000001, x: parseInt(results[i].timePurchased._hex, 16), category: parseInt(results[i].category._hex, 16), rarity: 0 /* parseInt(results[i].aavegotchiInfo_.modifiedRarityScore._hex, 16) */ })
    promises.push(diamond.getAavegotchi(parseInt(results[i].erc721TokenId._hex, 16)))
  }
  await Promise.all(promises).then(values => {
    for (var i = 0; i < values.length; i++) {
      dataArray[i].rarity = parseInt(values[i].modifiedRarityScore._hex, 16)
    }
  })
  return dataArray
}

async function getBazzarItems () {
  const diamond = createContract()
  const listingInfo = await diamond.getERC721Listings(0, 'listed', 8000)
  var listings = []
  for (let i = 0; i < listingInfo.length; i++) {
    listings.push({ link: `https://aavegotchi.com/baazaar/erc721/${parseInt(listingInfo[i].listingId._hex)}`, price: parseInt(listingInfo[i].priceInWei._hex) * 0.000000000000000001 })
  }
  console.log(`Listing length: ${listings.length} items`)
  return listings
}
Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    graphs: [],
    portalGraphs: [],
    listings: [],
    errors: []
  },
  mutations: {
    SET_GRAPHS (state, graphData) {
      state.graphs = graphData
      state.errors = []
    },
    SET_PORTAL_GRAPHS (state, graphData) {
      state.portalGraphs = graphData
      state.errors = []
    },
    SET_LISTINGS (state, listingData) {
      state.listings = listingData
      state.errors = []
    },
    SET_ERRORS (state, errorData) {
      state.errors = errorData
    }
  },
  actions: {
    fetchGraph ({ commit }, blocksShown) {
      return gotchiPrices(blocksShown).then(response => {
        commit('SET_GRAPHS', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
        throw error
      })
    },
    fetchPortalGraph ({ commit }, blocksShown) {
      return portalPrices(blocksShown).then(response => {
        commit('SET_PORTAL_GRAPHS', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
        throw error
      })
    },
    updateListing ({ commit }) {
      return getBazzarItems().then(response => {
        commit('SET_LISTINGS', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
        throw error
      })
    }
  }
})
