<template>
  <button
    v-if="showSettings"
    type="button"
    class="settingsButton"
    aria-label="設定"
    @click="onSettings"
  >
    <img src="/menu.svg" alt="" width="22" height="22" />
  </button>

  <p v-if="setLabel" class="setLabel">{{ setLabel }}</p>
</template>

<script setup lang="ts">
defineProps<{
  setLabel: string;
  showSettings: boolean;
  onSettings: () => void;
}>();
</script>
