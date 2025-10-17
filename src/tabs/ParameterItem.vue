<script>
export default {
  name: "ParameterItem",
  props: {
    keyName: {
      type: String,
      required: true
    },
    value: {
      type: [String, Number, Boolean, Object],
      required: true
    }
  }
};
</script>

<template>
  <div
      class="d-flex justify-content-between align-items-center mb-1 px-2 py-1 border rounded text-light bg-dark bg-opacity-25"
      style="font-size: 0.85rem; width: 320px"
  >
    <span>{{ keyName }}: {{ value }}</span>
    <button
        type="button"
        class="btn btn-sm btn-outline-danger p-1"
        style="font-size: 0.7rem; line-height: 1;"
        @click.stop="$emit('remove', keyName)"
    >
      ✕
    </button>
  </div>
</template>
