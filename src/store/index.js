import { ethers } from 'ethers'
// import Web3 from 'web3'

import Vue from 'vue'
import Vuex from 'vuex'
import abi from '@/diamond.json'

async function gotchiPrices (isGotchi) {
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  const provider = new ethers.providers.JsonRpcProvider('https://rpc-mainnet.matic.network/')
  const diamond = new ethers.Contract(aavegotchiDiamondAddress, abi, provider)

  const filter = diamond.filters.ERC721ExecutedListing()
  const results = await diamond.queryFilter(filter, 11516320)
  var dataArray = []
  var promises = []
  for (var i = 0; i < results.length; i++) {
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
  })
  return dataArray
}

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    graphs: [],
    errors: []
  },
  mutations: {
    SET_GRAPHS (state, graphData) {
      state.graphs = graphData
      state.errors = []
    },
    SET_ERRORS (state, errorData) {
      state.errors = errorData
    }
  },
  actions: {
    fetchGraph ({ commit }, isGotchi) {
      return gotchiPrices(isGotchi).then(response => {
        commit('SET_GRAPHS', response)
      }).catch(error => {
        commit('SET_ERRORS', error)
        throw error
      })
    }
  }
})
