"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import styles from "./index.module.css";
import {
  ExerciseConfig,
  loadWorkoutConfig,
  WorkoutConfig,
} from "../lib/workoutConfig";

type TimerPhase = "idle" | "workout" | "rest" | "completed";

type WorkoutStep = {
  set: number;
  exerciseIndex: number;
};

const PHASE_TRANSITION_DELAY_MS = 240;
const FILL_GROW_ANIMATION_MS = 180;

type WorkoutFillPhase = "normal" | "shrinking" | "growing";

const confettiPalette = [
  "linear-gradient(180deg, #f97316, #fb7185)",
  "linear-gradient(180deg, #38bdf8, #2563eb)",
  "linear-gradient(180deg, #22c55e, #15803d)",
  "linear-gradient(180deg, #eab308, #f97316)",
  "linear-gradient(180deg, #a855f7, #7c3aed)",
  "linear-gradient(180deg, #f43f5e, #be123c)",
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
    color: confettiPalette[i % confettiPalette.length],
  };
});

const getNextStep = (
  currentSet: number,
  currentExerciseIndex: number,
  config: WorkoutConfig,
): WorkoutStep | null => {
  if (currentExerciseIndex + 1 < config.exercises.length) {
    return { set: currentSet, exerciseIndex: currentExerciseIndex + 1 };
  }

  if (currentSet < config.sets) {
    return { set: currentSet + 1, exerciseIndex: 0 };
  }

  return null;
};

export default function TimerPage() {
  const router = useRouter();
  const [config, setConfig] = useState<WorkoutConfig | null>(null);
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentRep, setCurrentRep] = useState(1);
  const [secondsRemaining, setSecondsRemaining] = useState(1);
  const [pendingStep, setPendingStep] = useState<WorkoutStep | null>(null);
  const [workoutFillPhase, setWorkoutFillPhase] = useState<WorkoutFillPhase>("normal");

  useEffect(() => {
    const loadedConfig = loadWorkoutConfig();
    setConfig(loadedConfig);
    setCurrentSet(1);
    setCurrentExerciseIndex(0);
    setCurrentRep(loadedConfig.exercises[0].reps);
    setSecondsRemaining(loadedConfig.exercises[0].duration);
    setPhase("idle");
    setIsRunning(false);
    setWorkoutFillPhase("normal");
  }, []);

  useEffect(() => {
    if (!isRunning || (phase !== "workout" && phase !== "rest")) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, phase]);

  const currentExercise: ExerciseConfig | null = useMemo(() => {
    if (!config) {
      return null;
    }

    return config.exercises[currentExerciseIndex] ?? null;
  }, [config, currentExerciseIndex]);

  const nextExercise: ExerciseConfig | null = useMemo(() => {
    if (!config) {
      return null;
    }

    const step = pendingStep ?? getNextStep(currentSet, currentExerciseIndex, config);
    if (!step) {
      return null;
    }

    return config.exercises[step.exerciseIndex] ?? null;
  }, [config, pendingStep, currentSet, currentExerciseIndex]);

  useEffect(() => {
    if (!config || !isRunning || secondsRemaining > 0) {
      return;
    }

    if (phase === "workout") {
      setWorkoutFillPhase("shrinking");
    }

    const transitionTimer = window.setTimeout(() => {
      const active = config.exercises[currentExerciseIndex];
      if (!active) {
        return;
      }

      if (phase === "rest") {
        if (!pendingStep) {
          setPhase("completed");
          setIsRunning(false);
          return;
        }

        const target = config.exercises[pendingStep.exerciseIndex];
        setCurrentSet(pendingStep.set);
        setCurrentExerciseIndex(pendingStep.exerciseIndex);
        setCurrentRep(target.reps);
        setSecondsRemaining(target.duration);
        setPendingStep(null);
        setPhase("workout");
        setWorkoutFillPhase("growing");
        return;
      }

      if (phase !== "workout") {
        return;
      }

      if (currentRep > 1) {
        setCurrentRep((prev) => prev - 1);
        setSecondsRemaining(active.duration);
        setWorkoutFillPhase("growing");
        return;
      }

      const step = getNextStep(currentSet, currentExerciseIndex, config);
      if (!step) {
        setPhase("completed");
        setIsRunning(false);
        return;
      }

      if (config.restSeconds <= 0) {
        const target = config.exercises[step.exerciseIndex];
        setCurrentSet(step.set);
        setCurrentExerciseIndex(step.exerciseIndex);
        setCurrentRep(target.reps);
        setSecondsRemaining(target.duration);
        setWorkoutFillPhase("growing");
        return;
      }

      setPendingStep(step);
      setSecondsRemaining(config.restSeconds);
      setPhase("rest");
      setWorkoutFillPhase("normal");
    }, PHASE_TRANSITION_DELAY_MS);

    return () => window.clearTimeout(transitionTimer);
  }, [
    config,
    currentExerciseIndex,
    currentRep,
    currentSet,
    isRunning,
    pendingStep,
    phase,
    secondsRemaining,
  ]);

  useEffect(() => {
    if (workoutFillPhase !== "growing") {
      return;
    }

    const timer = window.setTimeout(() => {
      setWorkoutFillPhase("normal");
    }, FILL_GROW_ANIMATION_MS);

    return () => window.clearTimeout(timer);
  }, [workoutFillPhase]);

  if (!config || !currentExercise) {
    return (
      <main className={styles.page}>
        <p className={styles.loading}>読み込み中...</p>
      </main>
    );
  }

  const isResting = phase === "rest";
  const isCompleted = phase === "completed";
  const totalSeconds = isResting ? Math.max(config.restSeconds, 1) : currentExercise.duration;
  const elapsedRatio = Math.min(1, Math.max(0, (totalSeconds - secondsRemaining) / totalSeconds));
  const remainingRatio = Math.min(1, Math.max(0, secondsRemaining / totalSeconds));
  const timerFill = isResting ? remainingRatio : elapsedRatio;
  const displaySet = pendingStep ? pendingStep.set : currentSet;

  const resetTimer = () => {
    setCurrentSet(1);
    setCurrentExerciseIndex(0);
    setCurrentRep(config.exercises[0].reps);
    setSecondsRemaining(config.exercises[0].duration);
    setPendingStep(null);
    setPhase("idle");
    setIsRunning(false);
    setWorkoutFillPhase("normal");
  };

  const handleStartPause = () => {
    if (isCompleted) {
      return;
    }

    if (phase === "idle") {
      setPhase("workout");
      setIsRunning(true);
      return;
    }

    setIsRunning((prev) => !prev);
  };

  return (
    <main className={`${styles.page} ${isResting ? styles.restTheme : styles.workTheme}`}>
      {isCompleted && (
        <div className={styles.confettiLayer} aria-hidden="true">
          {CONFETTI_ITEMS.map((piece) => (
            <span
              key={piece.id}
              className={styles.confetti}
              style={
                {
                  left: piece.left,
                  ["--fall-delay" as string]: piece.delay,
                  ["--fall-duration" as string]: piece.duration,
                  ["--sway-duration" as string]: piece.swayDuration,
                  ["--drift-x" as string]: piece.drift,
                  ["--spin-rot" as string]: piece.spin,
                  ["--piece-w" as string]: piece.width,
                  ["--piece-h" as string]: piece.height,
                  ["--piece-color" as string]: piece.color,
                } as CSSProperties
              }
            >
              <span className={styles.confettiInner} />
            </span>
          ))}
        </div>
      )}
      {isCompleted ? (
        <section className={styles.completedCard}>
          <h1 className={styles.completedText}>おつかれさまでした！</h1>
          <button type="button" onClick={resetTimer} className={styles.primaryButton}>
            終了
          </button>
        </section>
      ) : (
        <section className={styles.timerCard}>
          {!isRunning && (
            <button
              type="button"
              className={styles.settingsButton}
              onClick={() => router.push("/settings")}
              aria-label="設定"
            >
              <Image src="/menu.svg" alt="" width={22} height={22} />
            </button>
          )}

          {!isResting && (
            <p className={styles.setLabel}>
              {displaySet} / {config.sets} セット
            </p>
          )}
          <h1 className={styles.exerciseName}>
            {isResting ? (
              <>
                <span className={styles.nextPrefix}>NEXT</span> {nextExercise?.name ?? ""}
              </>
            ) : (
              currentExercise.name
            )}
          </h1>

          <div
            className={`${styles.timerPanel} ${
              !isResting && workoutFillPhase === "shrinking" ? styles.panelShrink : ""
            } ${!isResting && workoutFillPhase === "growing" ? styles.panelGrow : ""}`}
          >
            <div
              className={`${styles.timerFill} ${isResting ? styles.restFill : styles.workFill}`}
              style={{ ["--fill-ratio" as string]: `${timerFill}` }}
            />
            <p className={styles.seconds}>{secondsRemaining}</p>
          </div>

          {!isResting && (
            <div className={styles.repSection}>
              <p className={styles.repText}>
                残り回数 {currentRep} / {currentExercise.reps}
              </p>
              <div className={styles.repGauge} aria-hidden="true">
                {Array.from({ length: currentExercise.reps }, (_, index) => (
                  <span
                    key={index}
                    className={`${styles.repSegment} ${
                      index < currentRep ? styles.repSegmentActive : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <button type="button" onClick={handleStartPause} className={styles.primaryButton}>
            {phase === "idle" ? "スタート" : isRunning ? "一時停止" : "再開"}
          </button>
        </section>
      )}
    </main>
  );
}

