import { ethers } from 'ethers'
// import Web3 from 'web3'

import Vue from 'vue'
import Vuex from 'vuex'
import abi from '@/diamond.json'

async function main () {
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  const provider = new ethers.providers.JsonRpcProvider('https://rpc-mainnet.matic.network/')
  const diamond = new ethers.Contract(aavegotchiDiamondAddress, abi, provider)

  const filter = diamond.filters.ERC721ExecutedListing()
  // const from = await provider.getBlockNumber()
  const results = await diamond.queryFilter(filter, 11516320)
  var arr = []
  var promises = []
  for (var i = 0; i < results.length; i++) {
    var category = '0'
    category = parseInt(results[i].args.category._hex, 16)
    const rarity = 0
    promises.push(category === 3 ? diamond.getAavegotchi(parseInt(results[i].args.erc721TokenId._hex, 16)) : Promise.resolve(0))
    // const rarity = category === 3 ? parseInt((await diamond.getAavegotchi(parseInt(results[i].args.erc721TokenId._hex, 16))).modifiedRarityScore._hex, 16) : 0
    arr.push({ y: parseInt(results[i].args.priceInWei._hex, 16) / 1000000000000000000, x: parseInt(results[i].args.time._hex, 16), category: category, rarity: rarity })
  }
  await Promise.all(promises).then(values => {
    // const rarity = parseInt(values.modifiedRarityScore._hex, 16)
    for (var i = 0; i < values.length; i++) {
      arr[i].rarity = values[i] === 0 ? 0 : parseInt(values[i].modifiedRarityScore._hex, 16)
    }
  })

  return arr
}

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    graphs: []
  },
  mutations: {
    SET_GRAPHS (state, graphData) {
      state.graphs = graphData
    }
  },
  actions: {
    fetchGraph ({ commit }) {
      return main().then(response => {
        commit('SET_GRAPHS', response)
      }).catch(error => {
        console.log(error)
        throw error
      })
    }
  },
  modules: {
  }
})
