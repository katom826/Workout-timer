<template>
  <div class="repSection">
    <p class="repText">
      <span>{{ currentRep }} / {{ totalReps }} 回</span>
      <span v-if="setLabel" class="repSetLabel">{{ setLabel }}</span>
    </p>
    <div class="repGauge" aria-hidden="true">
      <span
        v-for="(_, index) in totalReps"
        :key="index"
        class="repSegment"
        :class="{
          repSegmentActive: index < currentRep,
          repSegmentExit: pulseIndex === index
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentRep: number;
  totalReps: number;
  setLabel: string;
  pulseIndex: number | null;
}>();
</script>
