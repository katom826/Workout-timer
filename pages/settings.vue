<template>
  <main class="page">
    <section v-if="!config" class="panel">
      <p class="loading">読み込み中...</p>
    </section>

    <section v-else class="panel">
      <header class="header">
        <div class="headerTitle">
          <h1 class="title">タイマー設定</h1>
          <button type="button" class="soundButton" @click="router.push('/sound')">
            サウンド設定
          </button>
        </div>
        <button type="button" class="backButton" aria-label="戻る" @click="router.push('/')">
          <img src="/arrow_back.svg" alt="" width="22" height="22" />
        </button>
      </header>

      <div class="rowFields">
        <div class="fieldBlock">
          <label class="visuallyHidden" for="setCount">セット数</label>
          <div class="unitField">
            <input
              id="setCount"
              class="input compactNumberInput"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              :value="numericDrafts.sets ?? String(config.sets)"
              @input="handleSetsInput"
              @blur="clearNumericDraft('sets')"
            />
            <span class="unitText">セット</span>
          </div>
        </div>

        <div class="fieldBlock">
          <label class="visuallyHidden" for="restSeconds">休憩時間（秒）</label>
          <div class="unitField">
            <span class="unitText">休憩</span>
            <input
              id="restSeconds"
              class="input compactNumberInput"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              :value="numericDrafts.restSeconds ?? String(config.restSeconds)"
              @input="handleRestInput"
              @blur="clearNumericDraft('restSeconds')"
            />
            <span class="unitText">秒</span>
          </div>
        </div>
      </div>

      <section class="cards">
        <article
          v-for="(exercise, index) in config.exercises"
          :key="exercise.id"
          :data-exercise-index="index"
          class="card"
          :class="{
            cardDragging: dragSourceIndex === index,
            cardDropTarget: dragTargetIndex === index
          }"
          @dragover="(event) => handleDragOver(event, index)"
          @drop="(event) => handleDrop(event, index)"
          @dragend="handleDragEnd"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <div
            class="dragHandle"
            aria-hidden="true"
            title="ドラッグして移動"
            draggable="true"
            @dragstart="(event) => handleDragStart(event, index)"
            @touchstart.prevent="(event) => handleTouchStart(event, index)"
          >
            <img src="/drag_handle.svg" alt="" width="20" height="20" />
          </div>

          <div class="cardTopRow">
            <div class="nameField">
              <label class="visuallyHidden" :for="`name-${exercise.id}`">メニュー名</label>
              <input
                :id="`name-${exercise.id}`"
                class="input"
                type="text"
                placeholder="メニュー名"
                :value="exercise.name"
                @input="(event) => handleExerciseNameChange(index, (event.target as HTMLInputElement).value)"
              />
            </div>
          </div>

          <div class="inlineFields">
            <div class="fieldBlock">
              <label class="visuallyHidden" :for="`duration-${exercise.id}`">1回の時間（秒）</label>
              <div class="unitField">
                <input
                  :id="`duration-${exercise.id}`"
                  class="input compactNumberInput"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  :value="numericDrafts[`duration-${exercise.id}`] ?? String(exercise.duration)"
                  @input="(event) =>
                    handleNumericDraftChange(
                      `duration-${exercise.id}`,
                      (event.target as HTMLInputElement).value,
                      1,
                      3600,
                      (nextValue) => handleExerciseNumberChange(index, 'duration', nextValue)
                    )"
                  @blur="clearNumericDraft(`duration-${exercise.id}`)"
                />
                <span class="unitText">秒</span>
              </div>
            </div>

            <div class="fieldBlock">
              <label class="visuallyHidden" :for="`reps-${exercise.id}`">回数</label>
              <div class="unitField">
                <input
                  :id="`reps-${exercise.id}`"
                  class="input compactNumberInput"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  :value="numericDrafts[`reps-${exercise.id}`] ?? String(exercise.reps)"
                  @input="(event) =>
                    handleNumericDraftChange(
                      `reps-${exercise.id}`,
                      (event.target as HTMLInputElement).value,
                      1,
                      999,
                      (nextValue) => handleExerciseNumberChange(index, 'reps', nextValue)
                    )"
                  @blur="clearNumericDraft(`reps-${exercise.id}`)"
                />
                <span class="unitText">回</span>
              </div>
            </div>

            <button
              type="button"
              class="deleteIconButton"
              aria-label="削除"
              :disabled="config.exercises.length <= 1"
              @click="handleDeleteExercise(index)"
            >
              <img src="/delete.svg" alt="" width="20" height="20" />
            </button>
          </div>
        </article>

        <button type="button" class="addCardButton" @click="handleAddExercise">
          メニュー追加
        </button>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  type ExerciseConfig,
  type WorkoutConfig,
  loadWorkoutConfig,
  normalizeWorkoutConfig,
  saveWorkoutConfig
} from "~/utils/workoutConfig";

const router = useRouter();

const createExercise = (index: number): ExerciseConfig => ({
  id: `custom-${Date.now()}-${index}`,
  name: `メニュー ${index + 1}`,
  duration: 5,
  reps: 5
});

const config = ref<WorkoutConfig | null>(null);
const dragSourceIndex = ref<number | null>(null);
const dragTargetIndex = ref<number | null>(null);
const numericDrafts = ref<Record<string, string>>({});

onMounted(() => {
  config.value = loadWorkoutConfig();
});

watch(
  config,
  (next) => {
    if (!next) {
      return;
    }

    saveWorkoutConfig(normalizeWorkoutConfig(next));
  },
  { deep: true }
);

const setSets = (nextValue: number) => {
  if (!config.value) {
    return;
  }
  config.value = { ...config.value, sets: nextValue };
};

const setRestSeconds = (nextValue: number) => {
  if (!config.value) {
    return;
  }
  config.value = { ...config.value, restSeconds: nextValue };
};

const handleExerciseNameChange = (index: number, value: string) => {
  if (!config.value) {
    return;
  }

  const nextExercises = config.value.exercises.map((exercise, i) =>
    i === index ? { ...exercise, name: value } : exercise
  );

  config.value = { ...config.value, exercises: nextExercises };
};

const handleExerciseNumberChange = (
  index: number,
  key: "duration" | "reps",
  value: number
) => {
  if (!config.value) {
    return;
  }

  const nextExercises = config.value.exercises.map((exercise, i) =>
    i === index ? { ...exercise, [key]: value } : exercise
  );

  config.value = { ...config.value, exercises: nextExercises };
};

const handleNumericDraftChange = (
  fieldKey: string,
  value: string,
  min: number,
  max: number,
  onValidNumber: (nextValue: number) => void
) => {
  const sanitized = value.replace(/[^\d]/g, "");
  numericDrafts.value = { ...numericDrafts.value, [fieldKey]: sanitized };

  if (sanitized === "") {
    return;
  }

  const nextValue = Math.min(max, Math.max(min, Number(sanitized)));
  onValidNumber(nextValue);
};

const clearNumericDraft = (fieldKey: string) => {
  if (!(fieldKey in numericDrafts.value)) {
    return;
  }

  const next = { ...numericDrafts.value };
  delete next[fieldKey];
  numericDrafts.value = next;
};

const moveExercise = (from: number, to: number) => {
  if (!config.value || to < 0 || to >= config.value.exercises.length) {
    return;
  }

  const next = [...config.value.exercises];
  const [picked] = next.splice(from, 1);
  next.splice(to, 0, picked);
  config.value = { ...config.value, exercises: next };
};

const handleDragStart = (event: DragEvent, index: number) => {
  event.dataTransfer?.setData("text/plain", String(index));
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
  dragSourceIndex.value = index;
  dragTargetIndex.value = index;
};

const handleDragOver = (event: DragEvent, index: number) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
  dragTargetIndex.value = index;
};

const handleDrop = (event: DragEvent, index: number) => {
  event.preventDefault();

  if (dragSourceIndex.value === null || dragSourceIndex.value === index) {
    dragSourceIndex.value = null;
    dragTargetIndex.value = null;
    return;
  }

  moveExercise(dragSourceIndex.value, index);
  dragSourceIndex.value = null;
  dragTargetIndex.value = null;
};

const handleDragEnd = () => {
  dragSourceIndex.value = null;
  dragTargetIndex.value = null;
};

const handleTouchStart = (event: TouchEvent, index: number) => {
  event.preventDefault();
  dragSourceIndex.value = index;
  dragTargetIndex.value = index;
};

const handleTouchMove = (event: TouchEvent) => {
  if (dragSourceIndex.value === null) {
    return;
  }

  const touch = event.touches[0];
  if (!touch) {
    return;
  }

  const element = document.elementFromPoint(touch.clientX, touch.clientY);
  const card = element?.closest("[data-exercise-index]") as HTMLElement | null;
  if (!card) {
    return;
  }

  const nextIndex = Number(card.dataset.exerciseIndex);
  if (Number.isInteger(nextIndex)) {
    dragTargetIndex.value = nextIndex;
  }
};

const handleTouchEnd = () => {
  if (
    dragSourceIndex.value !== null &&
    dragTargetIndex.value !== null &&
    dragSourceIndex.value !== dragTargetIndex.value
  ) {
    moveExercise(dragSourceIndex.value, dragTargetIndex.value);
  }

  dragSourceIndex.value = null;
  dragTargetIndex.value = null;
};

const handleDeleteExercise = (index: number) => {
  if (!config.value || config.value.exercises.length <= 1) {
    return;
  }

  config.value = {
    ...config.value,
    exercises: config.value.exercises.filter((_, i) => i !== index)
  };
};

const handleAddExercise = () => {
  if (!config.value) {
    return;
  }

  config.value = {
    ...config.value,
    exercises: [...config.value.exercises, createExercise(config.value.exercises.length)]
  };
};

const handleSetsInput = (event: Event) => {
  handleNumericDraftChange(
    "sets",
    (event.target as HTMLInputElement).value,
    1,
    99,
    setSets
  );
};

const handleRestInput = (event: Event) => {
  handleNumericDraftChange(
    "restSeconds",
    (event.target as HTMLInputElement).value,
    0,
    600,
    setRestSeconds
  );
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24px;
  --theme-main: #f97316;
  background:
    linear-gradient(160deg, var(--bg-1), var(--bg-2) 45%, var(--bg-3));
  position: relative;
  overflow: hidden;
}

.page::after {
  content: none;
}

.panel {
  width: min(860px, 100%);
  margin-inline: auto;
  border-radius: 26px;
  border: 1px solid var(--panel-border);
  background: var(--panel-surface);
  box-shadow: var(--panel-shadow-soft);
  padding: clamp(14px, 3vw, 30px);
  position: relative;
  z-index: 1;
  backdrop-filter: blur(18px);
}

.loading {
  font-size: 1.15rem;
  color: var(--text-muted);
  text-align: center;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.headerTitle {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.title {
  font-size: clamp(1.7rem, 5vw, 2.7rem);
  color: var(--text-primary);
  font-weight: 900;
  letter-spacing: 0.01em;
}

.backButton {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid var(--chip-border);
  background: var(--chip-bg);
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
  box-shadow: var(--shadow-light);
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.backButton:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-strong);
}

.soundButton {
  border: 1px solid var(--chip-border);
  background: color-mix(in srgb, var(--chip-bg), transparent 15%);
  border-radius: 999px;
  padding: 8px 14px;
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--text-primary);
  cursor: pointer;
  box-shadow: var(--shadow-light);
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.soundButton:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-strong);
}

.section {
  margin-top: 16px;
  display: grid;
  gap: 8px;
}

.rowFields {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.rowFields .section {
  margin-top: 0;
}

.label {
  font-size: 0.95rem;
  color: var(--text-muted);
  font-weight: 700;
}

.input {
  width: 100%;
  border: 1px solid var(--input-border);
  border-radius: 10px;
  padding: 10px 12px;
  background: linear-gradient(180deg, var(--surface-1), var(--input-bg));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--panel-border), transparent 35%);
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.input:focus {
  outline: none;
  border-color: var(--input-focus);
  box-shadow: 0 0 0 3px var(--input-ring);
}

.compactNumberInput {
  width: 3.2em;
  min-width: 3.2em;
  height: 3.2em;
  padding: 0;
  text-align: center;
  font-weight: 800;
}

.cards {
  margin-top: 20px;
}

.card {
  border: 1px solid color-mix(in srgb, var(--panel-border), transparent 30%);
  background: linear-gradient(140deg, var(--surface-1), var(--surface-2) 45%, var(--surface-1));
  border-radius: 18px;
  padding: 14px;
  margin-bottom: 12px;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  align-items: start;
  column-gap: 10px;
  gap: 10px;
  box-shadow: var(--shadow-med);
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-strong);
}

.cardDragging {
  opacity: 0.65;
  transform: scale(0.985);
  cursor: grabbing;
}

.cardDropTarget {
  border-color: color-mix(in srgb, var(--theme-main), #7c3aed 35%);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-main), #c4b5fd 35%);
}

.dragHandle {
  grid-column: 1;
  grid-row: 1 / span 2;
  align-self: center;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  user-select: none;
  cursor: grab;
  touch-action: none;
  padding: 0;
  background: var(--chip-bg);
  border-radius: 10px;
  border: 1px solid var(--chip-border);
  box-shadow: var(--shadow-med);
}

.cardTopRow {
  grid-column: 2;
  grid-row: 1;
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: 10px;
}

.nameField {
  min-width: 0;
}

.inlineFields {
  grid-column: 2;
  grid-row: 2;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
  gap: 10px;
  align-items: end;
}

.fieldBlock {
  display: grid;
  gap: 8px;
}

.unitField {
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  align-items: center;
  justify-content: start;
  gap: 4px;
}

.unitText {
  font-weight: 800;
  color: var(--text-soft);
  white-space: nowrap;
}

.deleteIconButton {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: 1px solid var(--chip-border);
  padding: 0;
  background: color-mix(in srgb, var(--chip-bg), #fff1f2 35%);
  cursor: pointer;
  border-radius: 50%;
  box-shadow: var(--shadow-med);
}

.deleteIconButton:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.addCardButton {
  width: 100%;
  border: 1px dashed color-mix(in srgb, var(--theme-main), #ffffff 35%);
  background: color-mix(in srgb, var(--surface-1), transparent 30%);
  color: var(--text-primary);
  font-weight: 800;
  font-size: 1.05rem;
  border-radius: 16px;
  padding: 14px 16px;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  box-shadow: var(--shadow-light);
}

.addCardButton:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-strong);
  border-color: color-mix(in srgb, var(--theme-main), #ffffff 15%);
}

.visuallyHidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  clip: rect(0 0 0 0);
  overflow: hidden;
}

@media (max-width: 640px) {
  .page {
    padding: 12px;
  }

  .dragHandle {
    margin-bottom: 0;
  }
}

</style>


