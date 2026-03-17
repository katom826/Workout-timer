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

  <p v-if="currentExerciseName || nextExerciseName" class="currentExerciseLabel">
    <template v-if="isResting">
      <span v-if="nextExerciseName" class="nextRestLabel">Next {{ nextExerciseName }}</span>
    </template>
    <template v-else>
      <span>{{ currentExerciseName }}</span>
      <span v-if="isRunning && nextExerciseName" class="nextInlineLabel">
        Next {{ nextExerciseName }}
      </span>
    </template>
  </p>

</template>

<script setup lang="ts">
defineProps<{
  currentExerciseName: string;
  nextExerciseName: string;
  isResting: boolean;
  isRunning: boolean;
  showSettings: boolean;
  onSettings: () => void;
}>();
</script>
