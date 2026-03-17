<template>
  <main :class="['page', isResting ? 'restTheme' : 'workTheme']">
    <audio ref="tickSoundRef" src="/audio/tick.mp3" preload="auto" />
    <audio ref="repChangeSoundRef" src="/audio/rep_change.mp3" preload="auto" />
    <audio ref="clearSoundRef" src="/audio/clear.mp3" preload="auto" />

    <ConfettiLayer v-if="isCompleted" :pieces="CONFETTI_ITEMS" />

    <section v-if="!config || !currentExercise" class="timerCard">
      <p class="loading">読み込み中...</p>
    </section>

    <section v-else class="timerCard">
      <TimerHeader
        v-if="!isCompleted"
        :current-exercise-name="currentExercise?.name ?? ''"
        :next-exercise-name="nextExercise?.name ?? ''"
        :is-resting="isResting"
        :is-running="isRunning"
        :show-settings="!isRunning && !isCompleted"
        :on-settings="() => router.push('/settings')"
      />

      <TimerDisplay
        :seconds="displaySeconds"
        :show-fill="showScreenFill"
        :fill-ratio-a="fillRatioA"
        :fill-ratio-b="fillRatioB"
        :fade-layer="fadeLayer"
        :fade-token="fadeToken"
        :is-nice="isNiceMoment"
        :is-completed="isCompleted"
      />

      <Transition name="repFade">
        <RepGauge
          v-if="!isResting && !isCompleted"
          :current-rep="currentRep"
          :total-reps="currentExercise.reps"
          :set-label="setLabel"
          :pulse-index="repPulseIndex"
        />
      </Transition>

      <PrimaryAction
        :label="isCompleted ? '終了' : phase === 'idle' ? 'スタート' : isRunning ? '一時停止' : '再開'"
        :on-click="isCompleted ? resetTimer : handleStartPause"
        :no-shadow="true"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import ConfettiLayer from "~/components/ConfettiLayer.vue";
import PrimaryAction from "~/components/PrimaryAction.vue";
import RepGauge from "~/components/RepGauge.vue";
import TimerDisplay from "~/components/TimerDisplay.vue";
import TimerHeader from "~/components/TimerHeader.vue";
import {
  type ExerciseConfig,
  type WorkoutConfig,
  loadWorkoutConfig
} from "~/utils/workoutConfig";
import { loadSoundConfig } from "~/utils/soundConfig";

type TimerPhase = "idle" | "workout" | "rest" | "completed";

type WorkoutStep = {
  set: number;
  exerciseIndex: number;
};

const PHASE_TRANSITION_DELAY_MS = 240;
const REP_PREP_DELAY_MS = 1000;
const COMPLETION_DELAY_MS = 900;

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
const countdownRemainingMs = ref(0);
const pendingStep = ref<WorkoutStep | null>(null);
const activeFillLayer = ref<0 | 1>(0);
const fadeLayer = ref<0 | 1>(1);
const fadeToken = ref(0);

const tickSoundRef = ref<HTMLAudioElement | null>(null);
const repChangeSoundRef = ref<HTMLAudioElement | null>(null);
const clearSoundRef = ref<HTMLAudioElement | null>(null);

const rafId = ref<number | null>(null);
const countdownEndAt = ref<number | null>(null);
const countdownFinished = ref(false);
const transitionTimer = ref<number | null>(null);
const prepTimer = ref<number | null>(null);
const seEnabled = ref(true);
const isPrepDelay = ref(false);
const repPulseIndex = ref<number | null>(null);

const nowMs = (): number => performance.now();

const setCountdown = (seconds: number) => {
  secondsRemaining.value = seconds;
  countdownRemainingMs.value = Math.max(0, seconds * 1000);
  countdownEndAt.value = null;
  countdownFinished.value = false;
};

const stopCountdownLoop = () => {
  if (rafId.value) {
    window.cancelAnimationFrame(rafId.value);
    rafId.value = null;
  }
};

const startCountdownLoop = () => {
  stopCountdownLoop();
  rafId.value = window.requestAnimationFrame(updateCountdown);
};

const updateCountdown = () => {
  if (!isRunning.value || (phase.value !== "workout" && phase.value !== "rest") || isPrepDelay.value) {
    stopCountdownLoop();
    return;
  }

  const now = nowMs();
  if (countdownEndAt.value === null) {
    const baseMs = countdownRemainingMs.value || secondsRemaining.value * 1000;
    countdownEndAt.value = now + baseMs;
  }

  const remainingMs = countdownEndAt.value - now;
  countdownRemainingMs.value = Math.max(0, remainingMs);
  if (remainingMs <= 0) {
    if (secondsRemaining.value !== 0) {
      secondsRemaining.value = 0;
    }
    if (!countdownFinished.value) {
      countdownFinished.value = true;
      handleCountdownComplete();
    }
  } else {
    const nextSeconds = Math.ceil(remainingMs / 1000);
    if (nextSeconds !== secondsRemaining.value) {
      secondsRemaining.value = nextSeconds;
    }
  }

  rafId.value = window.requestAnimationFrame(updateCountdown);
};

const handleCountdownComplete = () => {
  if (!config.value || !isRunning.value) {
    return;
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

    const completeWorkout = () => {
      window.setTimeout(() => {
        phase.value = "completed";
        isRunning.value = false;
      }, COMPLETION_DELAY_MS);
    };

    if (phase.value === "rest") {
      if (!pendingStep.value) {
        completeWorkout();
        return;
      }

      const target = config.value.exercises[pendingStep.value.exerciseIndex];
      currentSet.value = pendingStep.value.set;
      currentExerciseIndex.value = pendingStep.value.exerciseIndex;
      currentRep.value = target.reps;
      setCountdown(target.duration);
      pendingStep.value = null;
      phase.value = "workout";
      return;
    }

    if (phase.value !== "workout") {
      return;
    }

    if (currentRep.value > 1) {
      if (prepTimer.value) {
        window.clearTimeout(prepTimer.value);
      }
      isPrepDelay.value = true;
      countdownRemainingMs.value = 0;
      prepTimer.value = window.setTimeout(() => {
        currentRep.value = currentRep.value - 1;
        setCountdown(active.duration);
        isPrepDelay.value = false;
      }, REP_PREP_DELAY_MS);
      return;
    }

    const step = getNextStep(currentSet.value, currentExerciseIndex.value, config.value);
    if (!step) {
      completeWorkout();
      isPrepDelay.value = false;
      return;
    }

    if (config.value.restSeconds <= 0) {
      const target = config.value.exercises[step.exerciseIndex];
      currentSet.value = step.set;
      currentExerciseIndex.value = step.exerciseIndex;
      currentRep.value = target.reps;
      setCountdown(target.duration);
      isPrepDelay.value = false;
      return;
    }

    pendingStep.value = step;
    setCountdown(config.value.restSeconds);
    phase.value = "rest";
    isPrepDelay.value = false;
  }, PHASE_TRANSITION_DELAY_MS);
};

const syncSoundConfig = () => {
  const updated = loadSoundConfig();
  seEnabled.value = updated.seEnabled;
};

const playSe = (audio: HTMLAudioElement | null) => {
  if (!audio || !seEnabled.value) {
    return;
  }
  audio.currentTime = 0;
  const playResult = audio.play();
  if (playResult) {
    playResult.catch(() => undefined);
  }
};

const applyInitialState = (loadedConfig: WorkoutConfig) => {
  currentSet.value = 1;
  currentExerciseIndex.value = 0;
  currentRep.value = loadedConfig.exercises[0].reps;
  setCountdown(loadedConfig.exercises[0].duration);
  pendingStep.value = null;
  phase.value = "idle";
  isRunning.value = false;
  isPrepDelay.value = false;
};

onMounted(() => {
  const loadedConfig = loadWorkoutConfig();
  config.value = loadedConfig;
  syncSoundConfig();
  applyInitialState(loadedConfig);
  window.addEventListener("sound-config-updated", syncSoundConfig);
  window.addEventListener("storage", syncSoundConfig);
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

  const step =
    pendingStep.value ?? getNextStep(currentSet.value, currentExerciseIndex.value, config.value);
  if (!step) {
    return null;
  }

  return config.value.exercises[step.exerciseIndex] ?? null;
});

watch([isRunning, phase, isPrepDelay], ([running, phaseValue, prep]) => {
  if (!running || prep || (phaseValue !== "workout" && phaseValue !== "rest")) {
    if (countdownEndAt.value !== null) {
      const remainingMs = Math.max(0, countdownEndAt.value - nowMs());
      countdownRemainingMs.value = remainingMs;
      secondsRemaining.value = Math.max(0, Math.ceil(remainingMs / 1000));
    }
    countdownEndAt.value = null;
    stopCountdownLoop();
    return;
  }

  startCountdownLoop();
});

watch(
  () => currentRep.value,
  (next, previous) => {
    if (typeof previous !== "number" || next >= previous) {
      return;
    }

    repPulseIndex.value = previous - 1;
    window.setTimeout(() => {
      if (repPulseIndex.value === previous - 1) {
        repPulseIndex.value = null;
      }
    }, 280);
  }
);

watch(
  () => secondsRemaining.value,
  (next, previous) => {
    if (previous === 1 && next === 0) {
      playSe(repChangeSoundRef.value);
      return;
    }

    if (previous === next + 1 && next > 0) {
      playSe(tickSoundRef.value);
    }
  }
);

watch(
  () => phase.value,
  (next) => {
    if (next !== "completed") {
      return;
    }

    playSe(clearSoundRef.value);
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

const totalMs = computed(() => totalSeconds.value * 1000);
const elapsedRatio = computed(() => {
  if (totalMs.value <= 0) {
    return 0;
  }
  return Math.min(
    1,
    Math.max(0, (totalMs.value - countdownRemainingMs.value) / totalMs.value)
  );
});
const remainingRatio = computed(() => {
  if (totalMs.value <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, countdownRemainingMs.value / totalMs.value));
});

const isZeroMoment = computed(
  () =>
    isRunning.value &&
    (phase.value === "workout" || phase.value === "rest") &&
    secondsRemaining.value === 0
);

const isNiceMoment = computed(() => isPrepDelay.value || isZeroMoment.value);

const timerFill = computed(() => {
  if (isZeroMoment.value) {
    return 1;
  }
  return isResting.value ? remainingRatio.value : elapsedRatio.value;
});

const displaySet = computed(() => (pendingStep.value ? pendingStep.value.set : currentSet.value));
const setLabel = computed(() =>
  !isResting.value && config.value ? `${displaySet.value} / ${config.value.sets} セット` : ""
);

const fillRatioA = computed(() =>
  activeFillLayer.value === 0 ? timerFill.value : fadeLayer.value === 0 ? 1 : 0
);
const fillRatioB = computed(() =>
  activeFillLayer.value === 1 ? timerFill.value : fadeLayer.value === 1 ? 1 : 0
);
const isResumeState = computed(() => !isRunning.value && phase.value !== "idle" && !isCompleted.value);

const resetTimer = () => {
  if (!config.value) {
    return;
  }
  applyInitialState(config.value);
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

const showScreenFill = computed(
  () => isRunning.value && (phase.value === "workout" || phase.value === "rest")
);

const displaySeconds = computed(() => {
  if (isCompleted.value) {
    return "おつかれさまでした！";
  }
  if (isZeroMoment.value && isResting.value) {
    return "Fight!";
  }
  if (isNiceMoment.value) {
    return "Nice!";
  }
  return String(secondsRemaining.value);
});

onBeforeUnmount(() => {
  stopCountdownLoop();
  if (transitionTimer.value) {
    window.clearTimeout(transitionTimer.value);
  }
  if (prepTimer.value) {
    window.clearTimeout(prepTimer.value);
  }
  window.removeEventListener("sound-config-updated", syncSoundConfig);
  window.removeEventListener("storage", syncSoundConfig);
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 28px;
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(150deg, var(--bg-1), var(--bg-2) 45%, var(--bg-3));
}

.page::after {
  content: none;
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
  border-radius: 30px;
  background: var(--panel-surface);
  border: 1px solid var(--panel-border);
  box-shadow: var(--panel-shadow);
  padding: clamp(20px, 5vw, 44px);
  position: relative;
  z-index: 2;
  overflow: hidden;
  backdrop-filter: blur(18px);
}

.timerCard {
  padding-top: calc(clamp(20px, 5vw, 44px) + 18px);
}

.loading {
  color: var(--text-muted);
  font-size: 1.2rem;
  font-weight: 700;
}

:global(.settingsButton) {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--theme-main), var(--panel-border) 55%);
  padding: 0;
  background: color-mix(in srgb, var(--chip-bg) 70%, transparent);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: var(--shadow-light);
  transition: transform 160ms ease, box-shadow 160ms ease;
}

:global(.settingsButton:hover) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-strong);
}

:global(.setLabel) {
  font-size: clamp(1.3rem, 3vw, 1.9rem);
  font-weight: 800;
  color: var(--theme-main);
}

:global(.currentExerciseLabel) {
  font-size: 1.3rem;
  font-weight: 800;
  color: #f97316;
  letter-spacing: 0.02em;
  margin-bottom: 8px;
  display: flex;
  align-items: baseline;
  gap: 10px;
}

:global(.nextInlineLabel) {
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffffff;
  opacity: 0.9;
  letter-spacing: 0.02em;
  margin-left: auto;
  text-align: right;
}

:global(.nextRestLabel) {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.02em;
}

:global(.exerciseName) {
  margin-top: 8px;
  font-size: clamp(1.6rem, 4vw, 2.5rem);
  font-weight: 900;
  color: var(--text-primary);
  min-height: 1.8em;
  letter-spacing: 0.01em;
}

:global(.nextPrefix) {
  font-size: 0.52em;
  letter-spacing: 0.08em;
  opacity: 0.75;
}

:global(.seconds) {
  position: relative;
  z-index: 2;
  min-height: 280px;
  margin-top: 12px;
  display: grid;
  place-items: center;
  font-size: clamp(5.2rem, 19vw, 11rem);
  font-weight: 900;
  letter-spacing: 0.04em;
  color: var(--text-primary);
  text-shadow: 0 1px 0 color-mix(in srgb, var(--panel-border), transparent 40%);
  font-family: "Space Grotesk", "Noto Sans JP", sans-serif;
  border: 2px solid color-mix(in srgb, var(--theme-main), #ffffff 35%);
  border-radius: 22px;
  overflow: hidden;
}

:global(.secondsCompleted) {
  font-size: 1.3rem;
  letter-spacing: 0.01em;
  min-height: 180px;
  text-align: center;
  padding: 0 16px;
}

:global(.secondsText) {
  position: relative;
  z-index: 2;
  display: inline-block;
  animation: secondsPop 220ms ease-out;
}

:global(.secondsNice .fillLayer) {
  transition: none;
}

@keyframes secondsPop {
  0% {
    transform: scale(0.9);
    opacity: 0.6;
  }

  60% {
    transform: scale(1.08);
    opacity: 1;
  }

  100% {
    transform: scale(1);
  }
}

:global(.repSection) {
  margin-top: 18px;
}

:global(.repText) {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-soft);
}

:global(.repSetLabel) {
  color: #ffffff;
  font-weight: 800;
  font-size: 1.05rem;
  letter-spacing: 0.02em;
}

:global(.repGauge) {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12px, 1fr));
  gap: 6px;
}

:global(.repFade-enter-active),
:global(.repFade-leave-active) {
  transition: opacity 240ms ease, transform 240ms ease;
}

:global(.repFade-enter-from),
:global(.repFade-leave-to) {
  opacity: 0;
  transform: translateY(8px);
}

:global(.repSegment) {
  height: 16px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--panel-border), transparent 65%);
  box-shadow: none;
}

:global(.repSegmentActive) {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--theme-main), #ffffff 12%),
    var(--theme-main)
  );
  box-shadow: none;
}

:global(.repSegmentExit) {
  animation: repSegmentExit 260ms ease-out;
}

@keyframes repSegmentExit {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  100% {
    transform: scale(0.7);
    opacity: 0.2;
  }
}

:global(.primaryButton) {
  margin-top: 26px;
  width: 100%;
  border: none;
  border-radius: 16px;
  padding: 14px 22px;
  font-size: clamp(1.2rem, 3vw, 1.6rem);
  font-weight: 900;
  cursor: pointer;
  color: #ffffff;
  background: color-mix(in srgb, #0b1020, var(--theme-main) 18%);
  box-shadow: none;
  position: relative;
  overflow: hidden;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

:global(.primaryButton:hover) {
  transform: translateY(-1px);
  box-shadow: none;
}

:global(.primaryButtonNoShadow),
:global(.primaryButtonNoShadow:hover) {
  box-shadow: none;
}

.completedCard {
  text-align: center;
}

.completedText {
  font-size: clamp(2.2rem, 8vw, 4.2rem);
  font-weight: 900;
  color: var(--text-primary);
}

:global(.confettiLayer) {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 18;
}

:global(.confetti) {
  position: absolute;
  top: -14vh;
  width: var(--piece-w);
  height: var(--piece-h);
  animation: confettiDrop var(--fall-duration) linear var(--fall-delay) infinite;
  will-change: transform;
}

:global(.confettiInner) {
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

:global(.screenFill) {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  mix-blend-mode: multiply;
}

:global(.fillLayer) {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  block-size: calc(var(--fill-ratio) * 100%);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--theme-main), #ffffff 30%),
    color-mix(in srgb, var(--theme-main), #0f172a 5%)
  );
  transition: block-size 1000ms linear;
  opacity: 1;
  box-shadow: 0 -30px 60px color-mix(in srgb, var(--theme-main), transparent 60%);
}

:global(.fillFade) {
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
    padding: 16px;
  }

  .timerCard,
  .completedCard {
    border-radius: 20px;
    padding: 16px;
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



