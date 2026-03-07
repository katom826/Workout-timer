"use client";

import { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import type { TouchEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import styles from "./settings.module.css";
import {
  ExerciseConfig,
  loadWorkoutConfig,
  normalizeWorkoutConfig,
  saveWorkoutConfig,
  WorkoutConfig,
} from "../lib/workoutConfig";

const createExercise = (index: number): ExerciseConfig => ({
  id: `custom-${Date.now()}-${index}`,
  name: `メニュー ${index + 1}`,
  duration: 5,
  reps: 5,
});

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<WorkoutConfig | null>(null);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const [numericDrafts, setNumericDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setConfig(loadWorkoutConfig());
  }, []);

  useEffect(() => {
    if (!config) {
      return;
    }

    saveWorkoutConfig(normalizeWorkoutConfig(config));
  }, [config]);

  const exerciseCount = useMemo(() => config?.exercises.length ?? 0, [config]);

  const handleExerciseNameChange = (index: number, value: string) => {
    if (!config) {
      return;
    }

    const nextExercises = config.exercises.map((exercise, i) => {
      if (i !== index) {
        return exercise;
      }

      return { ...exercise, name: value };
    });

    setConfig({ ...config, exercises: nextExercises });
  };

  const handleExerciseNumberChange = (
    index: number,
    key: "duration" | "reps",
    value: number,
  ) => {
    if (!config) {
      return;
    }

    const nextExercises = config.exercises.map((exercise, i) =>
      i === index ? { ...exercise, [key]: value } : exercise,
    );

    setConfig({ ...config, exercises: nextExercises });
  };

  const handleNumericDraftChange = (
    fieldKey: string,
    value: string,
    min: number,
    max: number,
    onValidNumber: (nextValue: number) => void,
  ) => {
    const sanitized = value.replace(/[^\d]/g, "");
    setNumericDrafts((prev) => ({ ...prev, [fieldKey]: sanitized }));

    if (sanitized === "") {
      return;
    }

    const nextValue = Math.min(max, Math.max(min, Number(sanitized)));
    onValidNumber(nextValue);
  };

  const clearNumericDraft = (fieldKey: string) => {
    setNumericDrafts((prev) => {
      if (!(fieldKey in prev)) {
        return prev;
      }

      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const moveExercise = (from: number, to: number) => {
    if (!config || to < 0 || to >= config.exercises.length) {
      return;
    }

    const next = [...config.exercises];
    const [picked] = next.splice(from, 1);
    next.splice(to, 0, picked);
    setConfig({ ...config, exercises: next });
  };

  const handleDragStart = (event: DragEvent<HTMLElement>, index: number) => {
    event.dataTransfer.effectAllowed = "move";
    setDragSourceIndex(index);
    setDragTargetIndex(index);
  };

  const handleDragOver = (event: DragEvent<HTMLElement>, index: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragTargetIndex(index);
  };

  const handleDrop = (event: DragEvent<HTMLElement>, index: number) => {
    event.preventDefault();

    if (dragSourceIndex === null || dragSourceIndex === index) {
      setDragSourceIndex(null);
      setDragTargetIndex(null);
      return;
    }

    moveExercise(dragSourceIndex, index);
    setDragSourceIndex(null);
    setDragTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDragSourceIndex(null);
    setDragTargetIndex(null);
  };

  const handleTouchStart = (event: TouchEvent<HTMLElement>, index: number) => {
    event.preventDefault();
    setDragSourceIndex(index);
    setDragTargetIndex(index);
  };

  const handleTouchMove = (event: TouchEvent<HTMLElement>) => {
    if (dragSourceIndex === null) {
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
      setDragTargetIndex(nextIndex);
    }
  };

  const handleTouchEnd = () => {
    if (
      dragSourceIndex !== null &&
      dragTargetIndex !== null &&
      dragSourceIndex !== dragTargetIndex
    ) {
      moveExercise(dragSourceIndex, dragTargetIndex);
    }

    setDragSourceIndex(null);
    setDragTargetIndex(null);
  };

  const handleDeleteExercise = (index: number) => {
    if (!config || config.exercises.length <= 1) {
      return;
    }

    setConfig({
      ...config,
      exercises: config.exercises.filter((_, i) => i !== index),
    });
  };

  const handleAddExercise = () => {
    if (!config) {
      return;
    }

    setConfig({
      ...config,
      exercises: [...config.exercises, createExercise(config.exercises.length)],
    });
  };

  if (!config) {
    return (
      <main className={styles.page}>
        <p className={styles.loading}>読み込み中...</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <header className={styles.header}>
          <h1 className={styles.title}>タイマー設定</h1>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => router.push("/")}
            aria-label="戻る"
          >
            <Image src="/arrow_back.svg" alt="" width={22} height={22} />
          </button>
        </header>

        <div className={styles.rowFields}>
          <div className={styles.fieldBlock}>
            <label className={styles.visuallyHidden} htmlFor="setCount">
              セット数
            </label>
            <div className={styles.unitField}>
              <input
                id="setCount"
                className={`${styles.input} ${styles.compactNumberInput}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={numericDrafts.sets ?? String(config.sets)}
                onChange={(event) =>
                  handleNumericDraftChange("sets", event.target.value, 1, 99, (nextValue) =>
                    setConfig({ ...config, sets: nextValue }),
                  )
                }
                onBlur={() => clearNumericDraft("sets")}
              />
              <span className={styles.unitText}>セット</span>
            </div>
          </div>

          <div className={styles.fieldBlock}>
            <label className={styles.visuallyHidden} htmlFor="restSeconds">
              休憩時間（秒）
            </label>
            <div className={styles.unitField}>
              <span className={styles.unitText}>休憩</span>
              <input
                id="restSeconds"
                className={`${styles.input} ${styles.compactNumberInput}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={numericDrafts.restSeconds ?? String(config.restSeconds)}
                onChange={(event) =>
                  handleNumericDraftChange(
                    "restSeconds",
                    event.target.value,
                    0,
                    600,
                    (nextValue) =>
                      setConfig({
                        ...config,
                        restSeconds: nextValue,
                      }),
                  )
                }
                onBlur={() => clearNumericDraft("restSeconds")}
              />
              <span className={styles.unitText}>秒</span>
            </div>
          </div>
        </div>

        <section className={styles.cards}>
          <div className={styles.cardsHeader}>
            <h2 className={styles.cardsTitle}>メニュー ({exerciseCount}件)</h2>
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleAddExercise}
              aria-label="メニュー追加"
            >
              <Image src="/add.svg" alt="" width={22} height={22} />
            </button>
          </div>

          {config.exercises.map((exercise, index) => (
            <article
              key={exercise.id}
              data-exercise-index={index}
              className={`${styles.card} ${
                dragSourceIndex === index ? styles.cardDragging : ""
              } ${dragTargetIndex === index ? styles.cardDropTarget : ""}`}
              onDragOver={(event) => handleDragOver(event, index)}
              onDrop={(event) => handleDrop(event, index)}
              onDragEnd={handleDragEnd}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className={styles.dragHandle}
                aria-hidden="true"
                title="ドラッグして並び替え"
                draggable
                onDragStart={(event) => handleDragStart(event, index)}
                onTouchStart={(event) => handleTouchStart(event, index)}
              >
                <Image src="/drag_handle.svg" alt="" width={20} height={20} />
              </div>

              <div className={styles.cardTopRow}>
                <div className={styles.nameField}>
                  <label className={styles.visuallyHidden} htmlFor={`name-${exercise.id}`}>
                    筋トレ名
                  </label>
                  <input
                    id={`name-${exercise.id}`}
                    className={styles.input}
                    type="text"
                    placeholder="筋トレ名"
                    value={exercise.name}
                    onChange={(event) => handleExerciseNameChange(index, event.target.value)}
                  />
                </div>
              </div>

              <div className={styles.inlineFields}>
                <div className={styles.fieldBlock}>
                  <label className={styles.visuallyHidden} htmlFor={`duration-${exercise.id}`}>
                    1回の時間（秒）
                  </label>
                  <div className={styles.unitField}>
                    <input
                      id={`duration-${exercise.id}`}
                      className={`${styles.input} ${styles.compactNumberInput}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={numericDrafts[`duration-${exercise.id}`] ?? String(exercise.duration)}
                      onChange={(event) =>
                        handleNumericDraftChange(
                          `duration-${exercise.id}`,
                          event.target.value,
                          1,
                          3600,
                          (nextValue) => handleExerciseNumberChange(index, "duration", nextValue),
                        )
                      }
                      onBlur={() => clearNumericDraft(`duration-${exercise.id}`)}
                    />
                    <span className={styles.unitText}>秒</span>
                  </div>
                </div>

                <div className={styles.fieldBlock}>
                  <label className={styles.visuallyHidden} htmlFor={`reps-${exercise.id}`}>
                    回数
                  </label>
                  <div className={styles.unitField}>
                    <input
                      id={`reps-${exercise.id}`}
                      className={`${styles.input} ${styles.compactNumberInput}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={numericDrafts[`reps-${exercise.id}`] ?? String(exercise.reps)}
                      onChange={(event) =>
                        handleNumericDraftChange(
                          `reps-${exercise.id}`,
                          event.target.value,
                          1,
                          999,
                          (nextValue) => handleExerciseNumberChange(index, "reps", nextValue),
                        )
                      }
                      onBlur={() => clearNumericDraft(`reps-${exercise.id}`)}
                    />
                    <span className={styles.unitText}>回</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.deleteIconButton}
                  onClick={() => handleDeleteExercise(index)}
                  disabled={config.exercises.length <= 1}
                  aria-label="カードを削除"
                >
                  <Image src="/delete.svg" alt="" width={20} height={20} />
                </button>
              </div>
            </article>
          ))}
        </section>

      </section>
    </main>
  );
}

