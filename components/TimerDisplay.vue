<template>
  <p class="seconds">{{ seconds }}</p>
</template>

<script setup lang="ts">
defineProps<{ seconds: number | string }>();
</script>



