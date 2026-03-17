<template>
  <div class="repSection">
    <p class="repText">残り回数 {{ currentRep }} / {{ totalReps }}</p>
    <div class="repGauge" aria-hidden="true">
      <span
        v-for="(_, index) in totalReps"
        :key="index"
        class="repSegment"
        :class="{ repSegmentActive: index < currentRep }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentRep: number;
  totalReps: number;
}>();
</script>
