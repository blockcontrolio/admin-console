<script>
import Networks from "./tabs/Networks.vue";
import Counterparties from "./tabs/Counterparties.vue";
import {getAllNetworks} from "./api/networks";

export default {
  name: 'App',
  components: {Networks, Counterparties},
  data() {
    return {
      apiKey: localStorage.getItem('x-api-key') || '',
      originalApiKey: '',
      notification: '',
      networks: []
    }
  },
  computed: {
    hasChanged() {
      return this.apiKey !== this.originalApiKey;
    }
  },
  methods: {
    async fetchNetworks() {
      try {
        this.networks = await getAllNetworks();
      } catch (err) {
        console.error('Error fetching networks', err);
      }
    },
    saveKey() {
      if (this.apiKey.trim()) {
        localStorage.setItem('x-api-key', this.apiKey.trim())
        this.originalApiKey = this.apiKey; // reset on change detection
        this.notification = 'Refresh data'
      }
    },
    clearKey() {
      localStorage.removeItem('x-api-key')
      this.apiKey = ''
    }
  },
  async mounted() {
    this.originalApiKey = this.apiKey;
    if (this.apiKey) {
      await this.fetchNetworks();
    }
  }
}
</script>

<template>
  <div class="container py-4">
    <h3 class="mb-4">Admin Console</h3>
    <input v-if="!apiKey" v-model="apiKey" class="form-control mb-2" placeholder="Enter x-api-key"/>
    <!-- show masked key if saved -->
    <div v-else class="form-control mb-2 text-muted">
      {{ '•'.repeat(apiKey.length) }}
      <button
          type="button"
          class="btn btn-sm btn-outline-secondary ms-2"
          @click="clearKey"
      >
        Clear
      </button>
    </div>
    <span v-if="apiKey === ''" class="form-text text-warning">Provide valid api key</span>
    <span v-else-if="this.notification" class="form-text text-warning">{{ this.notification }}</span>
    <div class="d-flex justify-content-end mt-3">
      <button
          class="btn btn-success"
          @click="saveKey"
          :disabled="!hasChanged">
        Save
      </button>
    </div>
  </div>

  <div v-if="apiKey && this.networks.length" class="container py-4">
    <ul class="nav nav-tabs" id="mainTabs" role="tablist">
      <li class="nav-item" role="presentation">
        <button
            class="nav-link active"
            id="networks-tab"
            data-bs-toggle="tab"
            data-bs-target="#networks"
            type="button"
            role="tab"
            aria-controls="networks"
            aria-selected="true"
        >
          Networks
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
            class="nav-link"
            id="counterparties-tab"
            data-bs-toggle="tab"
            data-bs-target="#counterparties"
            type="button"
            role="tab"
            aria-controls="counterparties"
            aria-selected="false"
        >
          Counterparties
        </button>
      </li>
    </ul>
    <div class="tab-content mt-3" id="mainTabsContent">
      <div
          class="tab-pane fade show active"
          id="networks"
          role="tabpanel"
          aria-labelledby="networks-tab"
      >
        <Networks :networks="networks"/>
      </div>
      <div
          class="tab-pane fade"
          id="counterparties"
          role="tabpanel"
          aria-labelledby="counterparties-tab"
      >
        <Counterparties :networks="networks"/>
      </div>
    </div>
  </div>


</template>
