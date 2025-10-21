<script>
import {
  addUserToCounterparty,
  createCounterparty,
  deleteParameters,
  fetchCounterparties,
  fetchCounterparty,
  fetchParameters,
  fetchProviders,
  updateCounterparty
} from '../api/counterparties.js'
import ParameterItem from "./ParameterItem.vue";
import ParameterForm from "./ParameterEdit.vue";
import {markRaw} from "vue";

export default {
  name: 'Counterparties',
  components: {ParameterForm, ParameterItem},
  props: ['networks'],
  data() {
    return {
      types: [
        {
          code: 'EMI'
        },
        {
          code: 'LSP'
        }],
      providers: ['MOCK', 'MPC_VAULT', 'UTILA', 'FIREBLOCKS', 'DFNS'],
      counterparties: [],
      showForm: "create_counterparty", // edit_counterparty, add_user
      editingId: null,
      newParam: "",
      counterpartyForm: this.emptyForm(),
      originalCounterpartyData: {},
      userRegistration: {},
      availableParameters: []
    };
  },
  methods: {
    async getCounterparties() {
      try {
        this.counterparties = await fetchCounterparties();
      } catch (err) {
        console.error('Error fetching counterparties', err);
      }
    },
    async getProviders() {
      try {
        this.providers = await fetchProviders();
      } catch (err) {
        console.error('Error fetching providers', err);
      }
    },
    async getParameters() {
      try {
        this.availableParameters = await fetchParameters(this.counterpartyForm.provider);
      } catch (err) {
        console.error('Error fetching parameters', err);
      }
    },
    async editCounterparty(id) {
      this.showForm = "edit_counterparty";
      this.editingId = id;
      try {
        const counterparty = await fetchCounterparty(id);
        this.originalCounterpartyData = markRaw({
          name: counterparty.name,
          type: counterparty.type,
          networkId: counterparty.network.id,
          provider: counterparty.provider,
          parameters: counterparty.parameters
        });
        this.counterpartyForm = markRaw({
          name: counterparty.name,
          type: counterparty.type,
          networkId: counterparty.network.id,
          provider: counterparty.provider,
          parameters: counterparty.parameters
        });
        if (counterparty.provider) {
          await this.getParameters();
        }
      } catch (err) {
        console.error('Error fetching counterparty', err);
      }
    },
    removeParameter(c, key) {
      if (confirm(`Remove parameter "${key}"?`)) {
        deleteParameters(c.id, {parameters: [key]})
        delete c.parameters[key];
      }
    },
    async handleCreateCounterparty() {
      const form = this.$refs.counterparty_form;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      try {
        let created = await createCounterparty(this.counterpartyForm);
        this.counterparties.push(created); // add to array
        this.resetCounterpartyForm();
      } catch (err) {
        console.error('Error creating counterparty:', err);
      }
    },
    async handleUpdateCounterparty() {
      const form = this.$refs.counterparty_form;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      try {
        const patch = this.preparePatchPayload();
        if (Object.keys(patch).length === 0) {
          console.log('No changes to send.');
          return;
        }

        console.log('Sending update counterparty:', patch);
        let updated = await updateCounterparty(this.editingId, patch);
        // find and replace in array
        const index = this.counterparties.findIndex(c => c.id === updated.id);
        if (index !== -1) {
          this.counterparties[index] = updated;
        }
        this.resetCounterpartyForm();
      } catch (err) {
        console.error('Error updating counterparty:', err);
      }
    },
    resetCounterpartyForm() {
      this.editingId = null;
      this.showForm = "create_counterparty";
      this.counterpartyForm = this.emptyForm();
      this.originalCounterpartyData = {};
    },
    openRegistration(counterpartyId) {
      this.editingId = counterpartyId;
      this.showForm = "add_user";
      this.userRegistration = markRaw({
        email: "",
        password: "",
        confirmPassword: "",
        counterpartyId: "",
        parameters: {}
      });
      this.userRegistration.counterpartyId = counterpartyId;
    },
    async submitRegistration() {
      try {
        await addUserToCounterparty(this.userRegistration);
        this.resetUserRegistrationForm();
      } catch (err) {
        console.error('Error registering user', err);
      }
    },
    resetUserRegistrationForm() {
      this.editingId = null;
      this.userRegistration = markRaw({
        email: "",
        password: "",
        confirmPassword: "",
        counterpartyId: "",
        parameters: {}
      });
      this.showForm = "create_counterparty";
    },
    emptyForm() {
      return markRaw({
        name: "",
        type: "",
        networkId: "",
        provider: "",
        parameters: {}
      });
    },
    preparePatchPayload() {
      const patch = {};

      // Compare top-level fields
      for (const key of ['name', 'provider']) {
        if (this.counterpartyForm[key] !== this.originalCounterpartyData[key]) {
          patch[key] = this.counterpartyForm[key];
        }
      }

      // Compare parameters object
      const paramPatch = {};
      for (const [key, value] of Object.entries(this.counterpartyForm.parameters)) {
        if (this.originalCounterpartyData.parameters[key] !== value) {
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
  computed: {
  },
  async mounted() {
    await Promise.all([
      this.getCounterparties(),
      this.getProviders()
    ]);
  }
};
</script>

<template>
  <div class="counterparties-tab container-fluid py-3">
    <!-- title -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="m-0">Counterparties</h4>
    </div>

    <!-- counterparties table -->
    <div class="table-responsive">
      <table class="table table-dark table-striped table-bordered" style="table-layout: auto;">
        <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Network</th>
          <th>Provider</th>
          <th>Parameters</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="c in counterparties" :key="c.id">
          <td>{{ c.name }}</td>
          <td>{{ c.type }}</td>
          <td>{{ c.network.name }}</td>
          <td>{{ c.provider }}</td>
          <td>
            <ParameterItem
                v-for="(value, key) in c.parameters"
                :key="key"
                :keyName="key"
                :value="value"
                @remove="removeParameter(c, $event)"
            />
          </td>
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
    <div v-if="(showForm === 'create_counterparty' || showForm === 'edit_counterparty') && providers.length" class="card bg-dark border-secondary p-3 mt-4">
      <h5 class="mb-3 text-light">{{ showForm === 'edit_counterparty' ? 'Update Counterparty' : 'Create Counterparty' }}</h5>
      <form ref="counterparty_form" @submit.prevent>
        <div class="mb-3">
          <label class="form-label text-light">Name</label>
          <input v-model="counterpartyForm.name" type="text" class="form-control" required/>
        </div>

        <div class="mb-3">
          <label class="form-label text-light">Type</label>
          <select v-model="counterpartyForm.type" class="form-select" required :disabled="showForm === 'edit_counterparty' && counterpartyForm.type">
            <option disabled value="">-- Counterparty Type --</option>
            <option v-for="t in types" :key="t.code" :value="t.code">
              {{ t.code }}
            </option>
          </select>
        </div>

        <!-- networks dropdown -->
        <div class="mb-3">
          <label class="form-label text-light">Network</label>
          <select v-model="counterpartyForm.networkId" class="form-select" required :disabled="showForm === 'edit_counterparty' && counterpartyForm.networkId">
            <option disabled value="">-- Select Network --</option>
            <option v-for="network in networks" :key="network.id" :value="network.id">
              {{ network.name }} (Chain ID: {{ network.chainId }})
            </option>
          </select>
        </div>

        <!-- providers dropdown -->
        <div class="mb-4">
          <label class="form-label text-light">Provider</label>
          <select v-model="counterpartyForm.provider" class="form-select" required :disabled="showForm === 'edit_counterparty' && counterpartyForm.provider"
                  v-on:change="this.getParameters()">
            <option disabled value="">-- Select Provider --</option>
            <option v-for="p in providers" :key="p" :value="p">
              {{ p }}
            </option>
          </select>
        </div>

        <ParameterForm v-model="counterpartyForm.parameters" :parameters="availableParameters"/>

        <div class="d-flex justify-content-end gap-2">
          <button v-if="showForm === 'create_counterparty'" type="submit" class="btn btn-success" @click="handleCreateCounterparty">
            {{ 'Create' }}
          </button>
          <button v-if="showForm === 'edit_counterparty'" type="submit" class="btn btn-success" @click="handleUpdateCounterparty">
            {{ 'Update' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="resetCounterpartyForm">Cancel</button>
        </div>
      </form>
    </div>

    <!-- user registration form -->
    <div v-if="showForm === 'add_user'" class="card bg-dark border-secondary p-3">
      <h5 class="mb-3 text-light">Add User to Counterparty</h5>
      <form @submit.prevent="submitRegistration">

        <div class="mb-3">
          <label class="form-label text-light">Counterparty</label>
          <input
              type="text"
              class="form-control"
              :value="counterparties.find(c => c.id === editingId)?.name || ''"
              readonly
          />
        </div>

        <div class="mb-3">
          <label class="form-label text-light">Email</label>
          <input v-model="userRegistration.email" type="email" class="form-control" required/>
        </div>

        <div class="mb-3">
          <label class="form-label text-light">Password</label>
          <input v-model="userRegistration.password" type="password" class="form-control" required/>
        </div>

        <div class="mb-3">
          <label class="form-label text-light">Confirm Password</label>
          <input v-model="userRegistration.confirmPassword" type="password" class="form-control" required/>
        </div>

        <div class="d-flex justify-content-end gap-2">
          <button type="submit" class="btn btn-primary">Register</button>
          <button type="button" class="btn btn-secondary" @click="resetUserRegistrationForm">Cancel</button>
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