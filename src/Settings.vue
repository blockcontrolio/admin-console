<script>
export default {
  data() {
    return {
      apiKey: localStorage.getItem('x-api-key') || '',
      originalApiKey: '',
      notification: ''
    }
  },
  computed: {
    hasChanged() {
      return this.apiKey !== this.originalApiKey;
    }
  },
  methods: {
    save() {
      localStorage.setItem('x-api-key', this.apiKey);
      this.originalApiKey = this.apiKey; // reset on change detection
      this.notification = 'Refresh page to get it working'
    }
  },
  mounted() {
    this.originalApiKey = this.apiKey;
  }
}
</script>

<template>
  <div>
    <h3 class="mb-3">API Settings</h3>
    <input v-model="apiKey" class="form-control text-white mb-2" placeholder="Enter x-api-key"/>
    <span v-if="apiKey === ''" class="form-text text-warning">Provide valid api key</span>
    <span v-else-if="this.notification" class="form-text text-warning">{{ this.notification }}</span>
    <div class="d-flex justify-content-end mt-3">
      <button
          class="btn btn-success"
          @click="save"
          :disabled="!hasChanged">
        Save
      </button>
    </div>
  </div>
</template>
