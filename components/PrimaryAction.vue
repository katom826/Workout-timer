<template>
  <button
    type="button"
    class="primaryButton"
    :class="{ primaryButtonNoShadow: noShadow }"
    @click="onClick"
  >
    {{ label }}
  </button>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  onClick: () => void;
  noShadow?: boolean;
}>();
</script>



