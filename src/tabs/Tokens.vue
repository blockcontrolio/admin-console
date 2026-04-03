<script>

import {fetchTokens} from "../api/tokens";

export default {
  name: 'Networks',
  props: ['networks'],
  data() {
    return {
      tokens: []
    };
  },
  methods: {
    formatTimestamp(timestamp) {
      // convert timestamp to milliseconds and construct Date object
      const date = new Date(timestamp * 1000);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    async fetchTokens() {
      try {
        this.tokens = await fetchTokens();
      } catch (err) {
        console.error('Error fetching tokens', err);
      }
    },
    findNetwork(tokenChainId) {
      let found = this.networks.find(t => t.chainId === tokenChainId);
      return `${found.name}: ${found.chainId}`;
    }
  },
  computed: {},
  async mounted() {
    await this.fetchTokens();
  }
};
</script>

<template>
  <div class="tokens-tab container-fluid py-3">
    <!-- title -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="m-0">Tokens</h4>
    </div>

    <!-- tokens table -->
    <div class="table-responsive">
      <table class="table table-dark table-striped table-bordered align-middle">
        <thead>
        <tr>
          <th>Name</th>
          <th>Symbol</th>
          <th>Chain ID</th>
          <th>Address</th>
          <th>Counterparty Owner</th>
          <th>Created At</th>
          <th>Updated At</th>
          <th>Active</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="token in tokens" :key="token.id">
          <td>{{ token.name }}</td>
          <td>{{ token.symbol }}</td>
          <td>{{ findNetwork(token.chainId) }}</td>
          <td>{{ token.address }}</td>
          <td>{{ token.issuerCounterparty?.name }}</td>
          <td>{{ formatTimestamp(token.createdAt) }}</td>
          <td>{{ formatTimestamp(token.updatedAt) }}</td>
          <td>{{ token.active }}</td>
        </tr>
        <tr v-if="tokens.length === 0">
          <td colspan="8" class="text-center">No tokens found</td>
        </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<style scoped>
.tokens-tab .table a {
  color: var(--bs-primary);
  text-decoration: none;
}

.tokens-tab .table a:hover {
  text-decoration: underline;
}
</style>