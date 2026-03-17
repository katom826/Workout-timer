<template>
  <div class="confettiLayer" aria-hidden="true">
    <span
      v-for="piece in pieces"
      :key="piece.id"
      class="confetti"
      :style="{
        left: piece.left,
        '--fall-delay': piece.delay,
        '--fall-duration': piece.duration,
        '--sway-duration': piece.swayDuration,
        '--drift-x': piece.drift,
        '--spin-rot': piece.spin,
        '--piece-w': piece.width,
        '--piece-h': piece.height,
        '--piece-color': piece.color
      } as CSSProperties"
    >
      <span class="confettiInner" />
    </span>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";

type ConfettiPiece = {
  id: number;
  left: string;
  delay: string;
  duration: string;
  swayDuration: string;
  drift: string;
  spin: string;
  width: string;
  height: string;
  color: string;
};

defineProps<{ pieces: ConfettiPiece[] }>();
</script>



