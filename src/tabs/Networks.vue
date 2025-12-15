<script>
import {createNetwork, deleteParameters, fetchNetworkById, fetchParameters, updateNetwork} from '../api/networks.js'
import ParameterItem from "./ParameterItem.vue";
import ParameterForm from "./ParameterEdit.vue";
import {markRaw} from "vue";

export default {
  name: 'Networks',
  components: {ParameterForm, ParameterItem},
  props: ['networks'],
  data() {
    return {
      editingId: null,
      newParam: "",
      form: this.emptyForm(),
      networkParameters: []
    };
  },
  methods: {
    emptyForm() {
      return markRaw({
        name: "",
        chainId: "",
        rpcUrl: "",
        explorerUrl: "",
        wsUrl: "",
        nativeAsset: {
          symbol: "",
          name: ""
        },
        parameters: {}
      });
    },
    async getParameters() {
      try {
        this.networkParameters = await fetchParameters();
      } catch (err) {
        console.error('Error fetching network parameters', err);
      }
    },
    removeParameter(n, key) {
      if (confirm(`Remove parameter "${key}"?`)) {
        deleteParameters(n.id, {parameters: [key]})
        delete n.parameters[key];
      }
    },
    async editNetwork(id) {
      this.editingId = id;
      try {
        const network = await fetchNetworkById(id);

        this.originalData = markRaw({
          ...network
        });
        this.form = markRaw({
          ...network
        });
      } catch (err) {
        console.error('Error fetching network', err);
      }
    },
    async handleCreate() {
      const form = this.$refs.form;
      // Let browser show validation errors if invalid
      if (!form.checkValidity()) {
        form.reportValidity(); // shows validation popup
        return;
      }
      try {
        let created = await createNetwork(this.form);
        this.networks.push(created); // add to array
        this.resetForm();
      } catch (err) {
        console.error('Error creating network:', err);
      }
    },
    async handleUpdate() {
      const form = this.$refs.form;
      // Let browser show validation errors if invalid
      if (!form.checkValidity()) {
        form.reportValidity(); // shows validation popup
      }
      try {
        const patch = this.preparePatchPayload();
        if (Object.keys(patch).length === 0) {
          console.log("No changes to send.");
          return;
        }
        console.log('Sending update network:', patch);
        let updated = await updateNetwork(this.editingId, this.form);
        // find and replace in array
        const index = this.networks.findIndex(c => c.id === updated.id);
        if (index !== -1) {
          this.networks[index] = updated;
        }
        this.resetForm();
      } catch (err) {
        console.error('Error updating network:', err);
      }
    },
    resetForm() {
      this.form = this.emptyForm();
      this.editingId = null;
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
  computed: {
  },
  async mounted() {
    await this.getParameters();
  }
};
</script>

<template>
  <div class="networks-tab container-fluid py-3">
    <!-- title -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="m-0">Networks</h4>
    </div>

    <!-- networks table -->
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
            <ParameterItem
                v-for="(value, key) in n.parameters"
                :key="key"
                :keyName="key"
                :value="value"
                @remove="removeParameter(n, $event)"
            />
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

    <!-- create / update form -->
    <div v-if="networkParameters.length" class="card bg-dark border-secondary p-3 mt-4">
      <h5 class="text-light mb-3">{{ editingId ? 'Update Network' : 'Create Network' }}</h5>
      <form ref="form" @submit.prevent>
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

        <ParameterForm v-model="form.parameters" :parameters="networkParameters"/>

        <div class="d-flex justify-content-end gap-2">
          <button v-if="!editingId" type="button" class="btn btn-sm btn-success" @click="handleCreate">
            Create
          </button>
          <button v-if="editingId" type="button" class="btn btn-sm btn-primary" @click="handleUpdate">
            Update
          </button>
          <button type="button" class="btn btn-sm btn-secondary" @click="resetForm">Cancel</button>
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