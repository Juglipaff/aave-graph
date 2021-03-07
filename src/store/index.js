import { ethers } from 'ethers'
// import Web3 from 'web3'

import Vue from 'vue'
import Vuex from 'vuex'
import abi from '@/diamond.json'

async function main () {
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  const provider = new ethers.providers.JsonRpcProvider('https://rpc-mainnet.maticvigil.com/v1/1f26d5bf264e7c37f4bcbe08df1de3db6ac3d51e')
  const diamond = new ethers.Contract(aavegotchiDiamondAddress, abi, provider)

  const filter = diamond.filters.ERC721ExecutedListing()
  const from = await provider.getBlockNumber()

  const results = await diamond.queryFilter(filter, from - 900)
  var arr = []
  for (var i = 0; i < results.length; i++) {
    var closedPortal = false
    if (results[i].args.category._hex === '0x00') {
    //  arr.push({ y: parseInt(results[i].args.priceInWei._hex, 16) / 1000000000000000000, x: parseInt(results[i].args.time._hex, 16) })
      closedPortal = true
    }
    arr.push({ y: parseInt(results[i].args.priceInWei._hex, 16) / 1000000000000000000, x: parseInt(results[i].args.time._hex, 16), closedPortal: closedPortal })
  }

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
