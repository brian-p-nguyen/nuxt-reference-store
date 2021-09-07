import { get, set, keys, del, clear as idbClear } from 'idb-keyval'

export const state = () => ({
  collectionLimit: 12,
  productIdbState: null,
  indexedDbWorker: null
})

export const mutations = {
  setProductIdbState(state, newState) {
    state.productIdbState = newState
  },
  startIndexedDbWorker: (state) => {
    state.indexedDbWorker =
      state.indexedDbWorker || new Worker('/worker/indexedDb.js')
  }
}

export const actions = {
  async nuxtClientInit(ctx, context) {
    // handle customerAccessToken
    let customerAccessToken = null
    if (context.app && context.app.$cookies) {
      const accessToken = context.app.$cookies.get('customerAccessToken')
      if (accessToken) {
        customerAccessToken = {
          accessToken,
          expiresAt: null
        }
      }
    }

    ctx.commit('account/setCustomerAccessToken', customerAccessToken)

    const projectId = await get('project-id').then(
      (id) => id && window.atob(id)
    )

    if (projectId && projectId !== this.$nacelle.client.id) {
      await idbClear()
    }

    set('project-id', window.btoa(this.$nacelle.client.id))
  },

  async clearProductIdb({ state, commit }) {
    if (!state.productIdbState) {
      commit('setProductIdbState', 'clearing')
      const idbKeys = await keys()

      const cleared = idbKeys
        .filter((key) => key.startsWith('product/'))
        .map((key) => del(key))

      await Promise.all(cleared)
      commit('setProductIdbState', 'cleared')
    }
  },
  getIndexedDbWorker({ state, commit }) {
    if (!state.indexedDbWorker) {
      commit('startIndexedDbWorker')
    }

    return state.indexedDbWorker
  }
}
