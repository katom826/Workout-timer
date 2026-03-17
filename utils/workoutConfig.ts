export type ExerciseConfig = {
  id: string;
  name: string;
  duration: number;
  reps: number;
};

export type WorkoutConfig = {
  sets: number;
  restSeconds: number;
  exercises: ExerciseConfig[];
};

export const WORKOUT_CONFIG_KEY = "workout-config-v1";

export const DEFAULT_WORKOUT_CONFIG: WorkoutConfig = {
  sets: 3,
  restSeconds: 20,
  exercises: [
    { id: "pushup", name: "腕立て伏せ", duration: 30, reps: 10 },
    { id: "squat", name: "スクワット", duration: 30, reps: 15 },
    { id: "plank", name: "プランク", duration: 40, reps: 1 }
  ]
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeExercise = (exercise: Partial<ExerciseConfig>, index: number): ExerciseConfig => {
  const fallbackName = `メニュー ${index + 1}`;
  const rawName = String(exercise.name ?? fallbackName).trim();

  return {
    id: exercise.id ?? `exercise-${index}-${Date.now()}`,
    name: rawName || fallbackName,
    duration: clamp(Number(exercise.duration) || 1, 1, 3600),
    reps: clamp(Number(exercise.reps) || 1, 1, 999)
  };
};

export const normalizeWorkoutConfig = (config: Partial<WorkoutConfig>): WorkoutConfig => {
  const exercisesSource = Array.isArray(config.exercises) ? config.exercises : [];
  const exercises = exercisesSource.length
    ? exercisesSource.map((exercise, index) => normalizeExercise(exercise, index))
    : DEFAULT_WORKOUT_CONFIG.exercises;

  return {
    sets: clamp(Number(config.sets) || DEFAULT_WORKOUT_CONFIG.sets, 1, 99),
    restSeconds: clamp(
      Number(config.restSeconds) || DEFAULT_WORKOUT_CONFIG.restSeconds,
      0,
      600
    ),
    exercises
  };
};

export const loadWorkoutConfig = (): WorkoutConfig => {
  if (import.meta.server) {
    return DEFAULT_WORKOUT_CONFIG;
  }

  const raw = localStorage.getItem(WORKOUT_CONFIG_KEY);
  if (!raw) {
    return DEFAULT_WORKOUT_CONFIG;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WorkoutConfig>;
    return normalizeWorkoutConfig(parsed);
  } catch {
    return DEFAULT_WORKOUT_CONFIG;
  }
};

export const saveWorkoutConfig = (config: WorkoutConfig): void => {
  if (import.meta.server) {
    return;
  }

  localStorage.setItem(WORKOUT_CONFIG_KEY, JSON.stringify(normalizeWorkoutConfig(config)));
};
