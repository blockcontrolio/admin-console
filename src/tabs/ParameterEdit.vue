<script>
export default {
  name: "ParameterForm",
  props: {
    modelValue: {
      type: Object,
      required: true
    },
    parameters: {
      type: Array,
      default: () => []
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      localParameters: {...this.modelValue},
      newParam: ""
    };
  },
  watch: {
    modelValue: {
      deep: true,
      handler(newVal) {
        this.localParameters = {...newVal};
      }
    },
    localParameters: {
      deep: true,
      handler(newVal) {
        this.$emit("update:modelValue", {...newVal});
      }
    }
  },
  methods: {
    addParameter() {
      if (this.newParam && !this.localParameters?.hasOwnProperty(this.newParam)) {
        this.localParameters = {...this.localParameters, [this.newParam]: ''};
        this.newParam = '';
      }
    },
  }
};
</script>

<template>
  <div>
    <!-- existing parameter inputs -->
    <div
        v-for="(value, key) in localParameters"
        :key="key"
        class="mb-3"
    >
      <label class="form-label text-light">{{ key }}</label>
      <input
          v-model="localParameters[key]"
          type="text"
          class="form-control"
      />
    </div>

    <!-- add parameters selector -->
    <div class="d-flex align-items-center mb-3">
      <select
          v-model="newParam"
          class="form-select me-2"
          style="max-width: 250px;"
      >
        <option disabled value="">Select parameter...</option>
        <option
            v-for="option in parameters"
            :key="option"
            :value="option"
            :disabled="Object.prototype.hasOwnProperty.call(localParameters, option)"
        >
          {{ option }}
        </option>
      </select>

      <button
          class="btn btn-outline-light"
          type="button"
          @click="addParameter"
          :disabled="!newParam || Object.prototype.hasOwnProperty.call(localParameters, newParam)"
      >
        +
      </button>
    </div>
  </div>
</template>
