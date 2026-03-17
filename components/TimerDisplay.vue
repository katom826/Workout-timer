<template>
  <p class="seconds" :class="{ secondsNice: isNice, secondsCompleted: isCompleted }">
    <ScreenFill
      v-if="showFill"
      :fill-ratio-a="fillRatioA"
      :fill-ratio-b="fillRatioB"
      :fade-layer="fadeLayer"
      :fade-token="fadeToken"
    />
    <span class="secondsText" :key="String(seconds)">{{ seconds }}</span>
  </p>
</template>

<script setup lang="ts">
import ScreenFill from "~/components/ScreenFill.vue";

defineProps<{
  seconds: number | string;
  showFill: boolean;
  fillRatioA: number;
  fillRatioB: number;
  fadeLayer: 0 | 1;
  fadeToken: number;
  isNice: boolean;
  isCompleted: boolean;
}>();
</script>
