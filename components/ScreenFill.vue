<template>
  <div class="screenFill" aria-hidden="true">
    <div
      :key="`fill-a-${fadeLayer === 0 ? fadeToken : 'static'}`"
      class="fillLayer"
      :class="{ fillFade: fadeLayer === 0 }"
      :style="{ '--fill-ratio': String(fillRatioA) }"
    />
    <div
      :key="`fill-b-${fadeLayer === 1 ? fadeToken : 'static'}`"
      class="fillLayer"
      :class="{ fillFade: fadeLayer === 1 }"
      :style="{ '--fill-ratio': String(fillRatioB) }"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  fillRatioA: number;
  fillRatioB: number;
  fadeLayer: 0 | 1;
  fadeToken: number;
}>();
</script>



