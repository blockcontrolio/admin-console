<script>
import {
  getCounterparties,
  getCounterparty,
  createCounterparty,
  addUserToCounterparty
} from '../api/counterparties.js'
import {
  getAllNetworks,
} from '../api/networks.js'

export default {
  name: 'Counterparties',
  data() {
    return {
      types: [
        {
          code: 'EMI'
        },
        {
          code: 'LSP'
        }],
      counterparties: [],
      networks: [], // store networks here
      editingId: null,
      registeringId: null,
      form: this.emptyForm(),
      registration: this.emptyRegistration()
    };
  },
  methods: {
    emptyForm() {
      return {
        name: "",
        type: "",
        vaultId: "",
        apiCosignerPublicKey: "",
        networkId: ""
      };
    },
    emptyRegistration() {
      return {
        email: "",
        password: "",
        confirmPassword: "",
        counterpartyId: ""
      };
    },
    async fetchCounterparties() {
      try {
        this.counterparties = await getCounterparties();
      } catch (err) {
        console.error('Error fetching counterparties', err);
      }
    },
    async fetchNetworks() { // fetch networks list
      try {
        this.networks = await getAllNetworks();
      } catch (err) {
        console.error('Error fetching networks', err);
      }
    },
    async editCounterparty(id) {
      this.registeringId = null;
      try {
        const c = await getCounterparty(id);
        this.editingId = id;
        this.form = {
          name: c.name,
          type: c.type,
          vaultId: c.vaultId,
          apiCosignerPublicKey: "",
          networkId: c.network?.id || ""
        };
      } catch (err) {
        console.error('Error fetching counterparty', err);
      }
    },
    async submitForm() {
      try {
        await createCounterparty(this.form);
        await this.fetchCounterparties();
        this.resetForm();
      } catch (err) {
        console.error('Error saving counterparty', err);
      }
    },
    resetForm() {
      this.editingId = null;
      this.form = this.emptyForm();
    },
    openRegistration(counterpartyId) {
      this.editingId = null;
      this.registeringId = counterpartyId;
      this.registration = this.emptyRegistration();
      this.registration.counterpartyId = counterpartyId;
    },
    async submitRegistration() {
      try {
        await addUserToCounterparty(this.registration);
        this.cancelRegistration();
      } catch (err) {
        console.error('Error registering user', err);
      }
    },
    cancelRegistration() {
      this.registeringId = null;
      this.registration = this.emptyRegistration();
    }
  },
  async mounted() {
    await Promise.all([
      this.fetchCounterparties(),
      this.fetchNetworks()
    ]);
  }
};
</script>

<template>
  <div class="counterparties-tab container-fluid py-3">
    <!-- title & refresh -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="m-0">Counterparties</h4>
      <button class="btn btn-sm btn-primary" @click="fetchCounterparties">
        Refresh
      </button>
    </div>

    <!-- counterparties table -->
    <div class="table-responsive mb-4">
      <table class="table table-dark table-striped table-bordered align-middle">
        <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th style="width: 340px;">Vault ID</th>
          <th>Chain ID</th>
          <th style="width: 180px;">Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="c in counterparties" :key="c.internalId">
          <td>{{ c.name }}</td>
          <td>{{ c.type }}</td>
          <td>{{ c.vaultId }}</td>
          <td>{{ c.network?.chainId }}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-info" @click="editCounterparty(c.internalId)">
              Edit
            </button>
            <span class="mx-2"></span>
            <button class="btn btn-sm btn-warning" @click="openRegistration(c.internalId)">
              Register User
            </button>
          </td>
        </tr>
        <tr v-if="counterparties.length === 0">
          <td colspan="4" class="text-center">No counterparties found</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- create / update form -->
    <div v-if="!registeringId" class="card bg-dark border-secondary p-3 mb-4">
      <h5 class="mb-3">{{ editingId ? 'Update Counterparty' : 'Create Counterparty' }}</h5>
      <form @submit.prevent="submitForm">
        <div class="mb-3">
          <label class="form-label text-light">Name</label>
          <input v-model="form.name" type="text" class="form-control" required/>
        </div>

        <div class="mb-3">
          <label class="form-label text-light">Type</label>
          <select v-model="form.type" class="form-select" required>
            <option disabled value="">-- Counterparty Type --</option>
            <option v-for="t in types" :key="t.code" :value="t.code">
              {{ t.code }}
            </option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label text-light">Vault ID</label>
          <input v-model="form.vaultId" type="text" class="form-control" required/>
        </div>

        <div class="mb-3">
          <label class="form-label text-light">API Cosigner Public Key</label>
          <input v-model="form.apiCosignerPublicKey" type="text" class="form-control" required/>
        </div>

        <!-- networks dropdown -->
        <div class="mb-3">
          <label class="form-label text-light">Network</label>
          <select v-model="form.networkId" class="form-select" required>
            <option disabled value="">-- Select Network --</option>
            <option v-for="n in networks" :key="n.id" :value="n.id">
              {{ n.name }} (Chain ID: {{ n.chainId }})
            </option>
          </select>
        </div>

        <div class="d-flex justify-content-end">
          <button type="submit" class="btn btn-success">
            {{ editingId ? 'Update' : 'Create' }}
          </button>
          <span class="mx-2"></span>
          <button type="button" class="btn btn-secondary" @click="resetForm">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- user registration form -->
    <div v-if="registeringId" class="card bg-dark border-secondary p-3">
      <h5 class="mb-3">Register User for Counterparty</h5>
      <form @submit.prevent="submitRegistration">

        <div class="mb-3">
          <label class="form-label text-light">Counterparty</label>
          <input
              type="text"
              class="form-control"
              :value="counterparties.find(c => c.internalId === registeringId)?.name || ''"
              readonly
          />
        </div>

        <div class="mb-3">
          <label class="form-label text-light">Email</label>
          <input v-model="registration.email" type="email" class="form-control" required/>
        </div>

        <div class="mb-3">
          <label class="form-label text-light">Password</label>
          <input v-model="registration.password" type="password" class="form-control" required/>
        </div>

        <div class="mb-3">
          <label class="form-label text-light">Confirm Password</label>
          <input v-model="registration.confirmPassword" type="password" class="form-control" required/>
        </div>

        <div class="d-flex justify-content-end">
          <button type="submit" class="btn btn-primary">
            Register
          </button>
          <span class="mx-2"></span>
          <button type="button" class="btn btn-secondary" @click="cancelRegistration">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.counterparties-tab .table a {
  color: var(--bs-primary);
  text-decoration: none;
}

.counterparties-tab .table a:hover {
  text-decoration: underline;
}
</style>