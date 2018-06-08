import Vue from 'vue'
import { uid } from 'quasar'
import copyObj from '../../helpers/copyObj'
import EthereumQRPlugin from 'ethereum-qr-code'

function initialState () {
  return {
    totalAmount: 0,
    totalAmountWei: 0,
    totalCount: 0,
    items: {},
    opened: {state: false},
    editing: {
      state: false,
      item: null
    },
    payment: {
      state: false,
      stage: 1
    }
  }
}
function limitNumberTo15 (nr) {
  const len = nr.toString().length
  if (len <= 15) return nr
  const excessLen = len - 15
  let floorLog = 10 ** excessLen
  return Math.floor(nr / floorLog) * floorLog
}


export default {
  namespaced: true,
  // modules: {  },
  state: initialState(),
  mutations:
  {
    resetStateData (state) {
      let newState = initialState()
      Object.assign(state, newState)
    },
    updateState (state, payload) {
      Object.keys(payload).forEach(key => {
        Vue.set(state, key, payload[key])
      })
    },
    addItem (state, item) {
      item = copyObj(item)
      if (!state.items[item.id]) {
        Vue.set(state.items, item.id, Object.assign({name: 'Item'}, item, {count: 0}))
      }
      state.items[item.id].count++
    },
    removeItem (state, item) {
      if (!state.items[item.id]) return
      if (!state.items[item.id].count) return
      state.items[item.id].count--
    },
    clearAll (state) {
      Object.values(state.items).forEach(item => {
        item.count = 0
      })
    },
    resetQR (state) {
      state.totalAmountWei = 0
      document.getElementById('js-qr').innerHTML = ''
    }
  },
  actions:
  {
    addItem ({state, getters, rootState, rootGetters, commit, dispatch},
    item) {
      item.price = (item.price === undefined)
        ? item.prices[rootState.settings.currency.currency]
        : item.price
      commit('addItem', item)
    },
    toggleCart ({state, getters, rootState, rootGetters, commit, dispatch},
    toggleState) {
      if (toggleState === undefined) {
        state.opened.state = !state.opened.state
        return
      }
      state.opened.state = toggleState
    },
    openMore ({state, getters, rootState, rootGetters, commit, dispatch},
    item) {
      state.editing.state = true
      state.editing.item = item
    },
    increment ({state, getters, rootState, rootGetters, commit, dispatch},
    item) {
      dispatch('addItem', item)
    },
    decrement ({state, getters, rootState, rootGetters, commit, dispatch},
    item) {
      commit('removeItem', item)
    },
    clearAll ({state, getters, rootState, rootGetters, commit, dispatch}) {
      commit('clearAll')
    },
    async generateQr ({state, getters, rootState, rootGetters, commit, dispatch}) {
      const qr = new EthereumQRPlugin()
      const currency = rootState.settings.currency.currency
      const amount = getters.totalAmount
      let value = await dispatch('conversion/convert', {
        amount,
        from: currency,
        to: 'wei'
      }, {root: true})
      value = limitNumberTo15(value)
      state.totalAmountWei = value
      const sendDetails = {
        value,
        to: rootState.settings.walletAddress,
        gas: rootState.settings.gas,
      }
      const domConfig = {
        // size: '100%',
        selector: '#js-qr',
        options: {
          margin: 0,
          padding: 0,
        }
      }
      const qrCode = qr.toCanvas(sendDetails, domConfig)
    },
  },
  getters:
  {
    totalAmount: (state, getters, rootState, rootGetters) => {
      return Object.values(state.items).reduce((carry, item) => { return carry + (item.count * item.price) }, 0)
    },
    totalCount: (state, getters, rootState, rootGetters) => {
      return Object.values(state.items).reduce((carry, item) => { return carry + item.count }, 0)
    },
    totalAmountEth: (state, getters, rootState, rootGetters) => {
      return state.totalAmountWei / rootState.conversion.ethTo['wei']
    },
    // itemsOverview: (state, getters, rootState, rootGetters) => {
    //   let items = state.items.reduce((carry, item) => {
    //     let id = (!item.id) ? uid() : item.id
    //     if (!carry[id]) carry[id] = {count: 0}
    //     Object.assign(carry[id], item)
    //     carry[id].count++
    //     return carry
    //   }, {})
    //   return items
    // },
  }
}