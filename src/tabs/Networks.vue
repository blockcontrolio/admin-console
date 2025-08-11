<script>
import {
  getAllNetworks,
  getNetworkById,
  createNetwork,
  updateNetwork
} from '../api/networks.js'

export default {
  name: 'Networks',
  data() {
    return {
      networks: []
    }
  },
  async mounted() {
    try {
      this.networks = await getAllNetworks()
    } catch (err) {
      console.error('Failed to load networks', err)
    }
  },
  methods: {
    async fetchNetwork(id) {
      return await getNetworkById(id)
    },
    async addNetwork(data) {
      return await createNetwork(data)
    },
    async editNetwork(id, data) {
      return await updateNetwork(id, data)
    }
  }
}
</script>

<template>

</template>

<style scoped>

</style>