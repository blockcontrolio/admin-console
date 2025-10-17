<script>
import {
  getCounterparties,
  getParameters,
  getCounterparty,
  createCounterparty,
  addUserToCounterparty,
  updateCounterparty,
  deleteParameters
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
      providers: ['MOCK', 'UTILA', 'FIREBLOCKS', 'DFNS'],
      counterparties: [],
      networks: [], // store networks here
      editingId: null,
      registeringId: null,
      newParam: '',
      form: this.emptyForm(),
      registration: this.emptyRegistration(),
      originalData: {},
      availableParameters: []
    };
  },
  methods: {
    emptyForm() {
      return {
        name: "",
        type: "",
        networkId: "",
        provider: "",
        parameters: {}
      };
    },
    emptyRegistration() {
      return {
        email: "",
        password: "",
        confirmPassword: "",
        counterpartyId: "",
        parameters: {}
      };
    },
    async fetchCounterparties() {
      try {
        this.counterparties = await getCounterparties();
      } catch (err) {
        console.error('Error fetching counterparties', err);
      }
    },
    async fetchNetworks() {
      try {
        this.networks = await getAllNetworks();
      } catch (err) {
        console.error('Error fetching networks', err);
      }
    },
    async fetchParameters() {
      try {
        this.availableParameters = await getParameters(this.form.provider);
      } catch (err) {
        console.error('Error fetching networks', err);
      }
    },
    async editCounterparty(id) {
      this.registeringId = null;
      try {
        const c = await getCounterparty(id);
        this.editingId = id;
        // Deep clone parameters (to break the shared reference)
        const clonedParameters = JSON.parse(JSON.stringify(c.parameters));
        this.originalData = {
          name: c.name ?? null,
          provider: c.provider ?? null,
          parameters: clonedParameters
        };

        this.form = {
          name: c.name,
          type: c.type,
          networkId: c.network?.id || "",
          provider: c.provider,
          parameters: JSON.parse(JSON.stringify(c.parameters))
        };
        if (c.provider) {
          await this.fetchParameters();
        }
      } catch (err) {
        console.error('Error fetching counterparty', err);
      }
    },
    addParameter() {
      if (this.newParam && !this.form.parameters?.hasOwnProperty(this.newParam)) {
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
    async submitForm() {
      try {
        if (!this.editingId) {
          await createCounterparty(this.form);
        } else {
          const patch = this.preparePatchPayload();
          if (Object.keys(patch).length === 0) {
            console.log('No changes detected');
            return;
          }
          console.log('Sending PATCH:', patch);

          if (Object.keys(patch).length === 0) {
            console.log("No changes to send.");
            return;
          }
          await updateCounterparty(this.editingId, patch);
        }
        await this.fetchCounterparties();
        this.resetForm();
      } catch (err) {
        console.error('Error saving counterparty', err);
      }
    },
    resetForm() {
      this.editingId = null;
      this.form = this.emptyForm();
      this.originalData = {};
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
    },
    preparePatchPayload() {
      const patch = {};

      // Compare top-level fields
      for (const key of ['name', 'provider']) {
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
    <div class="table-responsive">
      <table class="table table-dark table-striped table-bordered" style="table-layout: auto;">
        <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Parameters</th>
          <th>Chain ID</th>
          <th>Provider</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="c in counterparties" :key="c.id">
          <td>{{ c.name }}</td>
          <td>{{ c.type }}</td>
          <td>
            <div
                v-for="(value, key) in c.parameters"
                :key="key"
                class="d-flex justify-content-between align-items-center mb-1 px-2 py-1 border rounded text-light bg-dark bg-opacity-25"
                style="font-size: 0.85rem; width: 450px"
            >
              <span>{{ key }}: {{ value }}</span>
              <button
                  type="button"
                  class="btn btn-sm btn-outline-danger p-1"
                  style="font-size: 0.7rem; line-height: 1;"
                  @click.stop="removeParameter(c, key)"
              >
                ✕
              </button>
            </div>
          </td>
          <td>{{ c.networks?.[0].chainId }}</td>
          <td>{{ c.provider }}</td>
          <td class="text-center">
            <div class="d-inline-flex gap-2 flex-nowrap">
              <button class="btn btn-sm btn-info" @click="editCounterparty(c.id)">Edit</button>
              <button class="btn btn-sm btn-warning" @click="openRegistration(c.id)">Add User</button>
            </div>
          </td>
        </tr>
        <tr v-if="counterparties.length === 0">
          <td colspan="6" class="text-center">No counterparties found</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- create / update form -->
    <div v-if="!registeringId" class="card bg-dark border-secondary p-3 mt-4">
      <h5 class="mb-3">{{ editingId ? 'Update Counterparty' : 'Create Counterparty' }}</h5>
      <form @submit.prevent="submitForm">
        <div class="mb-3">
          <label class="form-label text-light">Name</label>
          <input v-model="form.name" type="text" class="form-control" required/>
        </div>

        <div class="mb-3">
          <label class="form-label text-light">Type</label>
          <select v-model="form.type" class="form-select" required :disabled="editingId && form.type">
            <option disabled value="">-- Counterparty Type --</option>
            <option v-for="t in types" :key="t.code" :value="t.code">
              {{ t.code }}
            </option>
          </select>
        </div>

        <!-- networks dropdown -->
        <div class="mb-3">
          <label class="form-label text-light">Network</label>
          <select v-model="form.networkId" class="form-select" required :disabled="editingId && form.networkId">
            <option disabled value="">-- Select Network --</option>
            <option v-for="n in networks" :key="n.id" :value="n.id">
              {{ n.name }} (Chain ID: {{ n.chainId }})
            </option>
          </select>
        </div>

        <!-- providers dropdown -->
        <div class="mb-4">
          <label class="form-label text-light">Provider</label>
          <select v-model="form.provider" class="form-select" required :disabled="editingId && form.provider" v-on:change="this.fetchParameters()">
            <option disabled value="">-- Select Provider --</option>
            <option v-for="p in providers" :key="p" :value="p">
              {{ p }}
            </option>
          </select>
        </div>

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
                  v-for="option in availableParameters"
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

    <!-- user registration form -->
    <div v-if="registeringId" class="card bg-dark border-secondary p-3">
      <h5 class="mb-3">Register User for Counterparty</h5>
      <form @submit.prevent="submitRegistration">

        <div class="mb-3">
          <label class="form-label text-light">Counterparty</label>
          <input
              type="text"
              class="form-control"
              :value="counterparties.find(c => c.id === registeringId)?.name || ''"
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

        <div class="d-flex justify-content-end gap-2">
          <button type="submit" class="btn btn-primary">Register</button>
          <button type="button" class="btn btn-secondary" @click="cancelRegistration">Cancel</button>
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