<script>
import {
  getAllNetworks,
  getNetworkById,
  createNetwork,
  updateNetwork,
  getParameters
} from '../api/networks.js'
import {deleteParameters} from "../api/counterparties";

export default {
  name: 'Networks',
  props: ['notification'],
  data() {
    return {
      networks: [],
      editingId: null,
      newParam: '',
      form: this.emptyForm(),
      networkParameters: []
    };
  },
  methods: {
    emptyForm() {
      return {
        name: '',
        chainId: '',
        rpcUrl: '',
        explorerUrl: '',
        wsUrl: '',
        nativeAsset: {
          symbol: '',
          name: '',
          decimals: ''
        },
        parameters: {}
      };
    },
    async fetchNetworks() {
      try {
        this.networks = await getAllNetworks();
        this.$emit('data-refreshed');
      } catch (err) {
        console.error('Error fetching networks', err);
      }
    },
    async getParameters() {
      try {
        this.networkParameters = await getParameters();
      } catch (err) {
        console.error('Error fetching network parameters', err);
      }
    },
    addParameter() {
      if (this.newParam && !this.form.parameters.hasOwnProperty(this.newParam)) {
        this.form.parameters = {...this.form.parameters, [this.newParam]: ''};
        this.newParam = '';
      }
    },
    removeParameter(c, key) {
      if (confirm(`Remove parameter "${key}"?`)) {
        deleteParameters(c.id, {parameters: [key]})
        delete c.parameters[key];
      }
    },
    async editNetwork(id) {
      try {
        const net = await getNetworkById(id);
        this.editingId = id;

        // Deep clone parameters (to break the shared reference)
        const clonedParameters = JSON.parse(JSON.stringify(net.parameters));
        this.originalData = {
          name: net.name ?? null,
          chainId: net.chainId,
          rpcUrl: net.rpcUrl,
          explorerUrl: net.explorerUrl,
          wsUrl: net.wsUrl,
          nativeAsset: {
            symbol: net.nativeAsset?.symbol ?? null,
            name: net.nativeAsset?.name ?? null
          },
          parameters: clonedParameters
        };

        this.form = {
          name: net.name,
          chainId: net.chainId,
          rpcUrl: net.rpcUrl,
          explorerUrl: net.explorerUrl,
          wsUrl: net.wsUrl,
          nativeAsset: {
            symbol: net.nativeAsset?.symbol,
            name: net.nativeAsset?.name
          },
          parameters: JSON.parse(JSON.stringify(net.parameters))
        };
      } catch (err) {
        console.error('Error fetching network', err);
      }
    },
    async submitForm() {
      try {
        if (!this.editingId) {
          await createNetwork(this.form);
        } else {
          const patch = this.preparePatchPayload();
          if (Object.keys(patch).length === 0) {
            console.log("No changes to send.");
            return;
          }
          console.log('Sending update network:', patch);

          await updateNetwork(this.editingId, this.form);
        }
        await this.fetchNetworks();
        this.resetForm();
      } catch (err) {
        console.error('Error saving network', err);
      }
    },
    resetForm() {
      this.editingId = null;
      this.form = this.emptyForm();
    },
    preparePatchPayload() {
      const patch = {};

      // Compare top-level fields
      for (const key of ['name', 'rpcUrl', 'explorerUrl', 'wsUrl']) {
        if (this.form[key] !== this.originalData[key]) {
          patch[key] = this.form[key];
        }
      }

      // Compare parameters object
      const paramPatch = {};
      for (const [key, value] of Object.entries(this.form.parameters)) {
        if (this.originalData.parameters[key] !== value) {
          paramPatch[key] = value;
        }
      }

      // Add only if parameters changed
      if (Object.keys(paramPatch).length > 0) {
        patch.parameters = paramPatch;
      }

      return patch;
    },
  },
  async mounted() {
    await Promise.all([
      this.fetchNetworks(),
      this.getParameters()
    ]);
  },
  emits: ['data-refreshed'],
};
</script>

<template>
  <div class="networks-tab container-fluid py-3">
    <!-- Title & Refresh -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="m-0">Networks</h4>
      <button
          class="btn btn-sm"
          @click="fetchNetworks()"
          :class="this.notification && this.notification.includes('Refresh') ? 'btn-warning' : 'btn-primary'"
      >
        Refresh
      </button>
    </div>

    <!-- Networks Table -->
    <div class="table-responsive">
      <table class="table table-dark table-striped table-bordered align-middle">
        <thead>
        <tr>
          <th>Name</th>
          <th>Chain ID</th>
          <th>Explorer URL</th>
          <th>Parameters</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="n in networks" :key="n.id">
          <td>{{ n.name }}</td>
          <td>{{ n.chainId }}</td>
          <td><a :href="n.explorerUrl" target="_blank">{{ n.explorerUrl }}</a></td>
          <td>
            <span v-for="p in n.parameters">{{p}}</span>
          </td>
          <td class="text-center">
            <button class="btn btn-sm btn-info" @click="editNetwork(n.id)">Edit</button>
          </td>
        </tr>
        <tr v-if="networks.length === 0">
          <td colspan="4" class="text-center">No networks found</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Create / Update Form -->
    <div class="card bg-dark border-secondary p-3 mt-4">
      <h5 class="text-light mb-3">{{ editingId ? 'Update Network' : 'Create Network' }}</h5>
      <form @submit.prevent="submitForm">
        <div class="mb-3">
          <label class="form-label text-light">Name</label>
          <input v-model="form.name" type="text" class="form-control" required minlength="4"/>
        </div>

        <div class="mb-3">
          <label class="form-label text-light">Chain ID</label>
          <input v-model.number="form.chainId" type="number" class="form-control" required min="1"/>
        </div>

        <div class="mb-3">
          <label class="form-label text-light">RPC URL</label>
          <input v-model="form.rpcUrl" type="url" class="form-control" required/>
        </div>

        <div class="mb-3">
          <label class="form-label text-light">Explorer URL</label>
          <input v-model="form.explorerUrl" type="url" class="form-control" required/>
        </div>

        <div class="mb-3">
          <label class="form-label text-light">WS URL</label>
          <input v-model="form.wsUrl" type="url" class="form-control" pattern="^wss?://.*" required/>
        </div>

        <!-- Optional Native Asset -->
        <fieldset class="border p-3 mb-4">
          <legend class="text-light float-none w-auto mb-0 fs-6">Native Asset (optional)</legend>
          <div class="row g-2 mt-1">
            <div class="col-md-6">
              <input v-model="form.nativeAsset.symbol" placeholder="Symbol" type="text" class="form-control"/>
            </div>
            <div class="col-md-6">
              <input v-model="form.nativeAsset.name" placeholder="Name" type="text" class="form-control"/>
            </div>
          </div>
        </fieldset>

        <div>
          <!-- existing parameter inputs -->
          <div
              v-for="(value, key) in form.parameters"
              :key="key"
              class="mb-3"
          >
            <label class="form-label text-light">{{ key }}</label>
            <input
                v-model="form.parameters[key]"
                type="text"
                class="form-control"
                :required="!editingId"
            />
          </div>

          <!-- add parameters selector -->
          <div class="d-flex align-items-center mb-3">
            <select v-model="newParam" class="form-select me-2" style="max-width: 250px;">
              <option disabled value="">Select parameter...</option>
              <option
                  v-for="option in networkParameters"
                  :key="option"
                  :value="option"
                  :disabled="form.parameters?.hasOwnProperty(option)"
              >
                {{ option }}
              </option>
            </select>

            <button
                class="btn btn-outline-light"
                type="button"
                @click="addParameter"
                :disabled="!newParam || form.parameters?.hasOwnProperty(newParam)"
            >
              +
            </button>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2">
          <button type="submit" class="btn btn-success">{{ editingId ? 'Update' : 'Create' }}</button>
          <button type="button" class="btn btn-secondary" @click="resetForm">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.networks-tab .table a {
  color: var(--bs-primary);
  text-decoration: none;
}

.networks-tab .table a:hover {
  text-decoration: underline;
}
</style>