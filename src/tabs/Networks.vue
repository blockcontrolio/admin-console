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
      networks: [],
      editingId: null,
      form: this.emptyForm(),
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
        }
      };
    },
    async fetchNetworks() {
      try {
        this.networks = await getAllNetworks();
      } catch (err) {
        console.error('Error fetching networks', err);
      }
    },
    async editNetwork(id) {
      try {
        const net = await getNetworkById(id);
        this.editingId = id;
        this.form = {
          name: net.name,
          chainId: net.chainId,
          rpcUrl: '', // not in NetworkResponse, user must re-enter if editing
          explorerUrl: net.explorerUrl,
          wsUrl: '',
          nativeAsset: {
            symbol: '',
            name: '',
            decimals: ''
          }
        };
      } catch (err) {
        console.error('Error fetching network', err);
      }
    },
    async submitForm() {
      try {
        if (this.editingId) {
          await updateNetwork(this.editingId, this.form);
        } else {
          await createNetwork(this.form);
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
    }
  },
  mounted() {
    this.fetchNetworks();
  }
};
</script>

<template>
  <div class="networks-tab container-fluid py-3">
    <!-- Title & Refresh -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="m-0">Networks</h4>
      <button class="btn btn-sm btn-primary" @click="fetchNetworks">
        Refresh
      </button>
    </div>

    <!-- Networks Table -->
    <div class="table-responsive mb-4">
      <table class="table table-dark table-striped table-bordered align-middle">
        <thead>
        <tr>
          <th>Name</th>
          <th>Chain ID</th>
          <th>Explorer URL</th>
          <th style="width: 100px;">Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="n in networks" :key="n.id">
          <td>{{ n.name }}</td>
          <td>{{ n.chainId }}</td>
          <td><a :href="n.explorerUrl" target="_blank">{{ n.explorerUrl }}</a></td>
          <td>
            <button class="btn btn-sm btn-info me-2" @click="editNetwork(n.id)">
              Edit
            </button>
          </td>
        </tr>
        <tr v-if="networks.length === 0">
          <td colspan="4" class="text-center">No networks found</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Create / Update Form -->
    <div class="card bg-dark border-secondary p-3">
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
        <fieldset class="border p-3 mb-3">
          <legend class="text-light float-none w-auto mb-0 fs-6">Native Asset (optional)</legend>
          <div class="row g-2 mt-1">
            <div class="col-md-4">
              <input v-model="form.nativeAsset.symbol" placeholder="Symbol" type="text" class="form-control"/>
            </div>
            <div class="col-md-4">
              <input v-model="form.nativeAsset.name" placeholder="Name" type="text" class="form-control"/>
            </div>
            <div class="col-md-4">
              <input v-model.number="form.nativeAsset.decimals" placeholder="Decimals" type="number" min="0"
                     class="form-control"/>
            </div>
          </div>
        </fieldset>

        <div class="d-flex justify-content-end">
          <button type="submit" class="btn btn-success me-2">
            {{ editingId ? 'Update' : 'Create' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="resetForm">
            Cancel
          </button>
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