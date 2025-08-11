<script>
import {
  getCounterparties,
  getCounterparty,
  createCounterparty,
  addUserToCounterparty
} from '../api/counterparties.js'

export default {
  name: 'Counterparties',
  data() {
    return {
      counterparties: []
    }
  },
  async mounted() {
    try {
      this.counterparties = await getCounterparties()
    } catch (err) {
      console.error('Failed to load counterparties', err)
    }
  },
  methods: {
    async fetchCounterparty(id) {
      return await getCounterparty(id)
    },
    async addCounterparty(data) {
      return await createCounterparty(data)
    },
    async registerUser(data) {
      return await addUserToCounterparty(data)
    }
  }
}
</script>

<template>

</template>

<style scoped>

</style>