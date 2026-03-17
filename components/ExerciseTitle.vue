<template>
  <h1 class="exerciseName">
    <template v-if="isResting">
      <span class="nextPrefix">NEXT</span> {{ nextLabel }}
    </template>
    <template v-else>
      {{ title }}
    </template>
  </h1>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  isResting: boolean;
  nextLabel: string;
}>();
</script>


