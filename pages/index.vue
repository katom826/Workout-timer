<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  type ExerciseConfig,
  type WorkoutConfig,
  loadWorkoutConfig
} from "~/utils/workoutConfig";

type TimerPhase = "idle" | "workout" | "rest" | "completed";

type WorkoutStep = {
  set: number;
  exerciseIndex: number;
};

type WorkoutFillPhase = "normal" | "shrinking" | "growing";

const PHASE_TRANSITION_DELAY_MS = 240;
const REP_PREP_DELAY_MS = 500;
const FILL_GROW_ANIMATION_MS = 180;

const confettiPalette = [
  "linear-gradient(180deg, #f97316, #fb7185)",
  "linear-gradient(180deg, #38bdf8, #2563eb)",
  "linear-gradient(180deg, #22c55e, #15803d)",
  "linear-gradient(180deg, #eab308, #f97316)",
  "linear-gradient(180deg, #a855f7, #7c3aed)",
  "linear-gradient(180deg, #f43f5e, #be123c)"
];

const seeded = (seed: number): number => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

const CONFETTI_ITEMS = Array.from({ length: 56 }, (_, i) => {
  const r1 = seeded(i + 1);
  const r2 = seeded((i + 1) * 3.1);
  const r3 = seeded((i + 1) * 5.7);
  const r4 = seeded((i + 1) * 9.9);

  return {
    id: i,
    left: `${Math.round(r1 * 100)}%`,
    delay: `${-(r2 * 5.2).toFixed(2)}s`,
    duration: `${(4.8 + r3 * 3.4).toFixed(2)}s`,
    swayDuration: `${(1 + r4 * 1.2).toFixed(2)}s`,
    drift: `${Math.round((r2 - 0.5) * 320)}px`,
    spin: `${Math.round((r3 > 0.5 ? 1 : -1) * (620 + r4 * 520))}deg`,
    width: `${Math.round(8 + r1 * 8)}px`,
    height: `${Math.round(12 + r3 * 13)}px`,
    color: confettiPalette[i % confettiPalette.length]
  };
});

const getNextStep = (
  currentSet: number,
  currentExerciseIndex: number,
  config: WorkoutConfig
): WorkoutStep | null => {
  if (currentExerciseIndex + 1 < config.exercises.length) {
    return { set: currentSet, exerciseIndex: currentExerciseIndex + 1 };
  }

  if (currentSet < config.sets) {
    return { set: currentSet + 1, exerciseIndex: 0 };
  }

  return null;
};

const config = ref<WorkoutConfig | null>(null);
const router = useRouter();
const phase = ref<TimerPhase>("idle");
const isRunning = ref(false);
const currentSet = ref(1);
const currentExerciseIndex = ref(0);
const currentRep = ref(1);
const secondsRemaining = ref(1);
const pendingStep = ref<WorkoutStep | null>(null);
const workoutFillPhase = ref<WorkoutFillPhase>("normal");
const activeFillLayer = ref<0 | 1>(0);
const fadeLayer = ref<0 | 1>(1);
const fadeToken = ref(0);

const tickSoundRef = ref<HTMLAudioElement | null>(null);
const repChangeSoundRef = ref<HTMLAudioElement | null>(null);
const clearSoundRef = ref<HTMLAudioElement | null>(null);

const intervalId = ref<number | null>(null);
const transitionTimer = ref<number | null>(null);
const prepTimer = ref<number | null>(null);
const fillGrowTimer = ref<number | null>(null);

onMounted(() => {
  const loadedConfig = loadWorkoutConfig();
  config.value = loadedConfig;
  currentSet.value = 1;
  currentExerciseIndex.value = 0;
  currentRep.value = loadedConfig.exercises[0].reps;
  secondsRemaining.value = loadedConfig.exercises[0].duration;
  phase.value = "idle";
  isRunning.value = false;
  workoutFillPhase.value = "normal";
});

const currentExercise = computed<ExerciseConfig | null>(() => {
  if (!config.value) {
    return null;
  }

  return config.value.exercises[currentExerciseIndex.value] ?? null;
});

const nextExercise = computed<ExerciseConfig | null>(() => {
  if (!config.value) {
    return null;
  }

  const step = pendingStep.value ?? getNextStep(currentSet.value, currentExerciseIndex.value, config.value);
  if (!step) {
    return null;
  }

  return config.value.exercises[step.exerciseIndex] ?? null;
});

watch([isRunning, phase], ([running, phaseValue]) => {
  if (intervalId.value) {
    window.clearInterval(intervalId.value);
    intervalId.value = null;
  }

  if (!running || (phaseValue !== "workout" && phaseValue !== "rest")) {
    return;
  }

  intervalId.value = window.setInterval(() => {
    secondsRemaining.value = Math.max(secondsRemaining.value - 1, 0);
  }, 1000);
});

watch(
  () => secondsRemaining.value,
  (next, previous) => {
    if (!isRunning.value || (phase.value !== "workout" && phase.value !== "rest")) {
      return;
    }

    if (previous === 1 && next === 0) {
      const audio = repChangeSoundRef.value;
      if (!audio) {
        return;
      }
      audio.currentTime = 0;
      const playResult = audio.play();
      if (playResult) {
        playResult.catch(() => undefined);
      }
      return;
    }

    if (previous === next + 1 && next > 0) {
      const audio = tickSoundRef.value;
      if (!audio) {
        return;
      }
      audio.currentTime = 0;
      const playResult = audio.play();
      if (playResult) {
        playResult.catch(() => undefined);
      }
    }
  }
);

watch(
  () => phase.value,
  (next) => {
    if (next !== "completed") {
      return;
    }

    const audio = clearSoundRef.value;
    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    const playResult = audio.play();
    if (playResult) {
      playResult.catch(() => undefined);
    }
  }
);

watch(
  () => secondsRemaining.value,
  (next, previous) => {
    if (!config.value || !isRunning.value || next > 0) {
      return;
    }

    if (previous === 0) {
      return;
    }

    if (phase.value === "workout") {
      workoutFillPhase.value = "shrinking";
    }

    if (transitionTimer.value) {
      window.clearTimeout(transitionTimer.value);
      transitionTimer.value = null;
    }

    transitionTimer.value = window.setTimeout(() => {
      const active = config.value?.exercises[currentExerciseIndex.value];
      if (!active) {
        return;
      }

      if (phase.value === "rest") {
        if (!pendingStep.value) {
          phase.value = "completed";
          isRunning.value = false;
          return;
        }

        const target = config.value.exercises[pendingStep.value.exerciseIndex];
        currentSet.value = pendingStep.value.set;
        currentExerciseIndex.value = pendingStep.value.exerciseIndex;
        currentRep.value = target.reps;
        secondsRemaining.value = target.duration;
        pendingStep.value = null;
        phase.value = "workout";
        workoutFillPhase.value = "growing";
        return;
      }

      if (phase.value !== "workout") {
        return;
      }

      if (currentRep.value > 1) {
        if (prepTimer.value) {
          window.clearTimeout(prepTimer.value);
        }
        prepTimer.value = window.setTimeout(() => {
          currentRep.value = currentRep.value - 1;
          secondsRemaining.value = active.duration;
          workoutFillPhase.value = "growing";
        }, REP_PREP_DELAY_MS);
        return;
      }

      const step = getNextStep(currentSet.value, currentExerciseIndex.value, config.value);
      if (!step) {
        phase.value = "completed";
        isRunning.value = false;
        return;
      }

      if (config.value.restSeconds <= 0) {
        const target = config.value.exercises[step.exerciseIndex];
        currentSet.value = step.set;
        currentExerciseIndex.value = step.exerciseIndex;
        currentRep.value = target.reps;
        secondsRemaining.value = target.duration;
        workoutFillPhase.value = "growing";
        return;
      }

      pendingStep.value = step;
      secondsRemaining.value = config.value.restSeconds;
      phase.value = "rest";
      workoutFillPhase.value = "normal";
    }, PHASE_TRANSITION_DELAY_MS);
  }
);

watch(
  () => workoutFillPhase.value,
  (next) => {
    if (next !== "growing") {
      return;
    }

    if (fillGrowTimer.value) {
      window.clearTimeout(fillGrowTimer.value);
      fillGrowTimer.value = null;
    }

    fillGrowTimer.value = window.setTimeout(() => {
      workoutFillPhase.value = "normal";
    }, FILL_GROW_ANIMATION_MS);
  }
);

watch(
  () => secondsRemaining.value,
  (next, previous) => {
    if (!isRunning.value || (phase.value !== "workout" && phase.value !== "rest")) {
      return;
    }

    if (typeof previous === "number" && next > previous) {
      fadeLayer.value = activeFillLayer.value;
      activeFillLayer.value = activeFillLayer.value === 0 ? 1 : 0;
      fadeToken.value = fadeToken.value + 1;
    }
  }
);

const isResting = computed(() => phase.value === "rest");
const isCompleted = computed(() => phase.value === "completed");

const totalSeconds = computed(() => {
  if (!currentExercise.value || !config.value) {
    return 1;
  }
  return isResting.value ? Math.max(config.value.restSeconds, 1) : currentExercise.value.duration;
});

const elapsedRatio = computed(() =>
  Math.min(1, Math.max(0, (totalSeconds.value - secondsRemaining.value) / totalSeconds.value))
);
const remainingRatio = computed(() =>
  Math.min(1, Math.max(0, secondsRemaining.value / totalSeconds.value))
);

const isZeroMoment = computed(
  () =>
    isRunning.value &&
    (phase.value === "workout" || phase.value === "rest") &&
    secondsRemaining.value === 0
);

const timerFill = computed(() => {
  if (isZeroMoment.value) {
    return 1;
  }
  return isResting.value ? remainingRatio.value : elapsedRatio.value;
});

const displaySet = computed(() => (pendingStep.value ? pendingStep.value.set : currentSet.value));

const fillRatioA = computed(() =>
  activeFillLayer.value === 0 ? timerFill.value : fadeLayer.value === 0 ? 1 : 0
);
const fillRatioB = computed(() =>
  activeFillLayer.value === 1 ? timerFill.value : fadeLayer.value === 1 ? 1 : 0
);

const resetTimer = () => {
  if (!config.value) {
    return;
  }
  currentSet.value = 1;
  currentExerciseIndex.value = 0;
  currentRep.value = config.value.exercises[0].reps;
  secondsRemaining.value = config.value.exercises[0].duration;
  pendingStep.value = null;
  phase.value = "idle";
  isRunning.value = false;
  workoutFillPhase.value = "normal";
};

const handleStartPause = () => {
  if (isCompleted.value) {
    return;
  }

  if (phase.value === "idle") {
    phase.value = "workout";
    isRunning.value = true;
    return;
  }

  isRunning.value = !isRunning.value;
};

onBeforeUnmount(() => {
  if (intervalId.value) {
    window.clearInterval(intervalId.value);
  }
  if (transitionTimer.value) {
    window.clearTimeout(transitionTimer.value);
  }
  if (prepTimer.value) {
    window.clearTimeout(prepTimer.value);
  }
  if (fillGrowTimer.value) {
    window.clearTimeout(fillGrowTimer.value);
  }
});
</script>

<template>
  <main :class="['page', isResting ? 'restTheme' : 'workTheme']">
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

    <audio ref="tickSoundRef" src="/audio/tick.mp3" preload="auto" />
    <audio ref="repChangeSoundRef" src="/audio/rep_change.mp3" preload="auto" />
    <audio ref="clearSoundRef" src="/audio/clear.mp3" preload="auto" />

    <div v-if="isCompleted" class="confettiLayer" aria-hidden="true">
      <span
        v-for="piece in CONFETTI_ITEMS"
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

    <section v-if="!config || !currentExercise" class="timerCard">
      <p class="loading">読み込み中...</p>
    </section>

    <section v-else-if="isCompleted" class="completedCard">
      <h1 class="completedText">おつかれさまでした！</h1>
      <button type="button" class="primaryButton" @click="resetTimer">終了</button>
    </section>

    <section v-else class="timerCard">
      <button
        v-if="!isRunning"
        type="button"
        class="settingsButton"
        aria-label="設定"
        @click="router.push('/settings')"
      >
        <img src="/menu.svg" alt="" width="22" height="22" />
      </button>

      <p v-if="!isResting" class="setLabel">{{ displaySet }} / {{ config.sets }} セット</p>

      <h1 class="exerciseName">
        <template v-if="isResting">
          <span class="nextPrefix">NEXT</span> {{ nextExercise?.name ?? "" }}
        </template>
        <template v-else>
          {{ currentExercise.name }}
        </template>
      </h1>

      <div
        class="timerPanel"
        :class="{
          panelShrink: !isResting && workoutFillPhase === 'shrinking',
          panelGrow: !isResting && workoutFillPhase === 'growing'
        }"
      >
        <p class="seconds">{{ secondsRemaining }}</p>
      </div>

      <div v-if="!isResting" class="repSection">
        <p class="repText">残り回数 {{ currentRep }} / {{ currentExercise.reps }}</p>
        <div class="repGauge" aria-hidden="true">
          <span
            v-for="(_, index) in currentExercise.reps"
            :key="index"
            class="repSegment"
            :class="{ repSegmentActive: index < currentRep }"
          />
        </div>
      </div>

      <button type="button" class="primaryButton" @click="handleStartPause">
        {{ phase === "idle" ? "スタート" : isRunning ? "一時停止" : "再開" }}
      </button>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24px;
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 8%, color-mix(in srgb, var(--theme-main), white 72%), transparent 35%),
    radial-gradient(circle at 86% 88%, color-mix(in srgb, var(--theme-main), white 80%), transparent 42%),
    linear-gradient(150deg, #f8fafc, #eef2ff 35%, #e2e8f0);
}

.workTheme {
  --theme-main: #f97316;
  --theme-soft: #ffedd5;
}

.restTheme {
  --theme-main: #38bdf8;
  --theme-soft: #e0f2fe;
}

.timerCard,
.completedCard {
  width: min(680px, 100%);
  border-radius: 28px;
  background: transparent;
  border: 3px solid color-mix(in srgb, var(--theme-main), #ffffff 45%);
  box-shadow: 0 30px 60px #00000020;
  padding: clamp(20px, 5vw, 44px);
  position: relative;
  z-index: 2;
  overflow: hidden;
}

.loading {
  color: #4b5563;
  font-size: 1.2rem;
  font-weight: 700;
}

.settingsButton {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.setLabel {
  font-size: clamp(1.3rem, 3vw, 1.9rem);
  font-weight: 800;
  color: var(--theme-main);
}

.exerciseName {
  margin-top: 8px;
  font-size: clamp(1.6rem, 4vw, 2.5rem);
  font-weight: 900;
  color: #0f172a;
  min-height: 1.8em;
}

.nextPrefix {
  font-size: 0.52em;
  letter-spacing: 0.08em;
  opacity: 0.75;
}

.timerPanel {
  margin-top: 24px;
  border-radius: 24px;
  min-height: 280px;
  position: relative;
  isolation: isolate;
  border: 3px solid color-mix(in srgb, var(--theme-main), #ffffff 10%);
  background: linear-gradient(180deg, #f8fafc, color-mix(in srgb, var(--theme-soft), white 60%));
  overflow: hidden;
  transform: scaleY(1);
  transform-origin: center;
}

.panelShrink {
  animation: fillShrinkCenter 140ms cubic-bezier(0.25, 0.8, 0.35, 1) forwards;
}

.panelGrow {
  animation: fillGrowCenter 180ms cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
}

.seconds {
  position: relative;
  z-index: 2;
  min-height: 280px;
  display: grid;
  place-items: center;
  font-size: clamp(4.4rem, 17vw, 9rem);
  font-weight: 900;
  letter-spacing: 0.04em;
  color: #0f172a;
  text-shadow: 0 1px 0 #ffffffa1;
}

.repSection {
  margin-top: 18px;
}

.repText {
  font-size: 1.3rem;
  font-weight: 800;
  color: #334155;
}

.repGauge {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12px, 1fr));
  gap: 6px;
}

.repSegment {
  height: 16px;
  border-radius: 4px;
  background: #d1d5db;
}

.repSegmentActive {
  background: color-mix(in srgb, var(--theme-main), #ffffff 15%);
}

.primaryButton {
  margin-top: 26px;
  width: 100%;
  border: none;
  border-radius: 16px;
  padding: 14px 22px;
  font-size: clamp(1.2rem, 3vw, 1.6rem);
  font-weight: 900;
  cursor: pointer;
  color: #ffffff;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--theme-main), #ffffff 18%),
    var(--theme-main)
  );
}

.completedCard {
  text-align: center;
}

.completedText {
  font-size: clamp(2.2rem, 8vw, 4.2rem);
  font-weight: 900;
  color: #0f172a;
}

.confettiLayer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 18;
}

.confetti {
  position: absolute;
  top: -14vh;
  width: var(--piece-w);
  height: var(--piece-h);
  animation: confettiDrop var(--fall-duration) linear var(--fall-delay) infinite;
  will-change: transform;
}

.confettiInner {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 3px;
  background: var(--piece-color);
  opacity: 0.95;
  animation: confettiSpin var(--sway-duration) ease-in-out infinite alternate;
  will-change: transform;
}

@keyframes confettiDrop {
  from {
    transform: translate3d(0, -10vh, 0);
  }

  60% {
    transform: translate3d(calc(var(--drift-x) * 0.55), 68vh, 0);
  }

  to {
    transform: translate3d(var(--drift-x), 118vh, 0);
  }
}

@keyframes confettiSpin {
  from {
    transform: translateX(-10px) rotate(0deg);
  }

  to {
    transform: translateX(10px) rotate(var(--spin-rot));
  }
}

@keyframes fillShrinkCenter {
  from {
    transform: scaleY(1);
  }

  to {
    transform: scaleY(0);
  }
}

@keyframes fillGrowCenter {
  from {
    transform: scaleY(0);
  }

  to {
    transform: scaleY(1);
  }
}

.screenFill {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.fillLayer {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  block-size: calc(var(--fill-ratio) * 100%);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--theme-main), #ffffff 18%),
    var(--theme-main)
  );
  transition: block-size 1000ms linear;
  opacity: 1;
}

.fillFade {
  animation: fillFadeOut 900ms ease-out forwards;
}

@keyframes fillFadeOut {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@media (max-width: 640px) {
  .page {
    padding: 14px;
  }

  .timerCard,
  .completedCard {
    border-radius: 20px;
    padding: 16px;
  }

  .timerPanel {
    min-height: 230px;
  }

  .seconds {
    min-height: 230px;
  }

  .settingsButton {
    top: 12px;
    right: 12px;
  }
}
</style>

