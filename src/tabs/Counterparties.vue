<script>
import {
  addUserToCounterparty,
  createCounterparty,
  deleteParameters,
  fetchCounterparties,
  fetchCounterparty,
  fetchParameters,
  fetchProviders,
  fetchUsersInCounterparty,
  editUserInCounterparty,
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
      roles: ['USER', 'ADMIN'],
      types: [
        {
          code: 'EMI'
        },
        {
          code: 'LSP'
        }],
      providers: ['MOCK', 'MPC_VAULT', 'UTILA', 'FIREBLOCKS', 'DFNS'],
      counterparties: [],
      selectedCounterpartyId: null,
      users: [],
      showForm: null, // create_counterparty, edit_counterparty, add_user, edit_user
      editingId: null,
      newParam: "",
      counterpartyForm: this.emptyForm(),
      originalCounterpartyData: {},
      userRegistration: {},
      userEmail: {},
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
    async loadUsers(counterpartyId) {
      try {
        this.users = await fetchUsersInCounterparty(counterpartyId);
        this.selectedCounterpartyId = counterpartyId
        this.showForm = "list_users";
      } catch (err) {
        console.error('Error fetching users in counterparty', err);
      }
    },
    addCounterparty() {
      this.resetCounterpartyForm();
      this.showForm = "create_counterparty";
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
      this.showForm = null;
      this.counterpartyForm = this.emptyForm();
      this.originalCounterpartyData = {};
    },
    addUser(counterpartyId) {
      this.editingId = counterpartyId;
      this.showForm = "add_user";
      this.userRegistration = markRaw({
        email: "",
        role: "",
        parameters: {}
      });
    },
    editUser(counterpartyId, email) {
      this.editingId = counterpartyId;
      this.showForm = "edit_user";
      this.userEmail = markRaw({
        email: email
      });
    },
    async submitUserRegistration(counterpartyId) {
      try {
        await addUserToCounterparty(counterpartyId, this.userRegistration);
        this.resetUserRegistrationForm();
      } catch (err) {
        console.error('Error registering user', err);
      }
    },
    async submitUserUpdate(counterpartyId) {
      try {
        await editUserInCounterparty(counterpartyId, this.userEmail);
        this.resetUserRegistrationForm();
      } catch (err) {
        console.error('Error registering user', err);
      }
    },
    resetUserRegistrationForm() {
      this.editingId = null;
      this.userRegistration = markRaw({
        email: "",
        role: "",
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
    <div v-if="!showForm" class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="m-0">Counterparties</h4>
    </div>
    <div v-if="!showForm" class="d-flex justify-content-end my-3">
      <button class="btn btn-sm btn-secondary" @click="addCounterparty()">Add Counterparty</button>
    </div>

    <!-- counterparties table -->
    <div v-if="!showForm" class="table-responsive">
      <table class="table table-dark table-striped table-bordered" style="table-layout: auto;">
        <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Network</th>
          <th>Provider</th>
          <th>Parameters</th>
          <th class="text-end">Actions</th>
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
            <div class="d-inline-flex justify-content-end gap-2 flex-nowrap">
              <button class="btn btn-sm btn-info" @click="editCounterparty(c.id)">Edit</button>
              <button class="btn btn-sm btn-warning" @click="loadUsers(c.id)">Manage Users</button>
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
          <button v-if="showForm === 'create_counterparty'" type="submit" class="btn btn-sm btn-success" @click="handleCreateCounterparty">
            {{ 'Create' }}
          </button>
          <button v-if="showForm === 'edit_counterparty'" type="submit" class="btn btn-sm btn-success" @click="handleUpdateCounterparty">
            {{ 'Update' }}
          </button>
          <button type="button" class="btn btn-sm btn-secondary" @click="resetCounterpartyForm">Cancel</button>
        </div>
      </form>
    </div>

    <!-- user registration form -->
    <div v-if="showForm === 'add_user'" class="card bg-dark border-secondary p-3">
      <h5 class="mb-3 text-light">Add User to Counterparty</h5>
      <form @submit.prevent="submitUserRegistration(editingId)">

        <div class="mb-3">
          <label class="form-label text-light">Counterparty</label>
          <input
              type="text"
              class="form-control"
              :value="counterparties.find(c => c.id === editingId)?.name || ''"
              readonly
          />
        </div>

        <!-- roles dropdown -->
        <div class="mb-4">
          <label class="form-label text-light">Role</label>
          <select v-model="userRegistration.role" class="form-select" required>
            <option disabled value="">-- Select Role --</option>
            <option v-for="role in roles" :key="role" :value="role">
              {{ role }}
            </option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label text-light">Email</label>
          <input v-model="userRegistration.email" type="email" class="form-control" required/>
        </div>

        <div class="d-flex justify-content-end gap-2">
          <button type="submit" class="btn btn-sm btn-primary">Add User</button>
          <button type="button" class="btn btn-sm btn-secondary" @click="resetUserRegistrationForm">Cancel</button>
        </div>
      </form>
    </div>

    <div v-if="showForm === 'edit_user'" class="card bg-dark border-secondary p-3">
      <h5 class="mb-3 text-light">Update User in {{counterparties.find(c => c.id === editingId)?.name || ''}} Counterparty</h5>
      <form @submit.prevent="submitUserUpdate(editingId)">

        <div class="mb-3">
          <label class="form-label text-light">Actual Email</label>
          <input v-model="userEmail.email" type="email" class="form-control" readonly/>
        </div>

        <div class="mb-3">
          <label class="form-label text-light">New Email</label>
          <input v-model="userEmail.newEmail" type="email" class="form-control" required/>
        </div>

        <div class="mb-3">
          <label class="form-label text-light">Confirm Email</label>
          <input v-model="userEmail.confirmEmail" type="email" class="form-control" required/>
        </div>

        <div class="d-flex justify-content-end gap-2">
          <button type="submit" class="btn btn-sm btn-primary">Update User</button>
          <button type="button" class="btn btn-sm btn-secondary" @click="resetUserRegistrationForm">Cancel</button>
        </div>
      </form>
    </div>

    <!-- users table -->
    <div v-if="showForm === 'list_users'" class="table-responsive">

      <!-- title -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="m-0">Users</h4>
      </div>

      <div class="d-flex justify-content-end my-3">
        <button class="btn btn-sm btn-secondary" @click="addUser(this.selectedCounterpartyId)">Add User</button>
      </div>
      <table class="table table-dark table-striped table-bordered" style="table-layout: auto;">
        <thead>
        <tr>
          <th>ID</th>
          <th>Role</th>
          <th>Enable</th>
          <th>Created</th>
          <th class="text-end">Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="user in users" :key="user.email">
          <td>{{ user.email }}</td>
          <td>{{ user.role }}</td>
          <td>{{ user.enabled }}</td>
          <td>{{ user.createdAt }}</td>
          <td class="text-center">
            <div class="d-flex justify-content-end gap-2 flex-nowrap">
              <button class="btn btn-sm btn-warning" @click="editUser(this.selectedCounterpartyId, user.email)">Edit User</button>
            </div>
          </td>
        </tr>
        <tr v-if="users.length === 0">
          <td colspan="6" class="text-center">No users found</td>
        </tr>
        </tbody>
      </table>
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