import type { Diagram } from "@flow/shared/types/diagram";
import type { SimulationMetrics } from "@flow/shared/types/validation";

const KEY = "flow.progress.v1";

export interface LevelProgress {
  completed: boolean;
  bestMetrics?: SimulationMetrics;
  lastDiagram?: Diagram;
}

export type ProgressMap = Record<string, LevelProgress>;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadProgress(): ProgressMap {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressMap): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // ignore quota errors
  }
}

export function recordCompletion(
  levelId: string,
  metrics: SimulationMetrics,
  diagram: Diagram,
): ProgressMap {
  const all = loadProgress();
  const prev = all[levelId];
  const better = !prev?.bestMetrics || metrics.p95Latency < prev.bestMetrics.p95Latency;
  all[levelId] = {
    completed: true,
    bestMetrics: better ? metrics : prev?.bestMetrics,
    lastDiagram: diagram,
  };
  saveProgress(all);
  return all;
}

export function recordAttempt(levelId: string, diagram: Diagram): ProgressMap {
  const all = loadProgress();
  all[levelId] = { ...(all[levelId] ?? { completed: false }), lastDiagram: diagram };
  saveProgress(all);
  return all;
}

const LESSON_KEY = "flow.lessonsSeen.v1";

function loadLessonsSeen(): Record<string, true> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(LESSON_KEY);
    return raw ? (JSON.parse(raw) as Record<string, true>) : {};
  } catch {
    return {};
  }
}

export function hasSeenLesson(levelId: string): boolean {
  return loadLessonsSeen()[levelId] === true;
}

export function markLessonSeen(levelId: string): void {
  if (!isBrowser()) return;
  const seen = loadLessonsSeen();
  if (seen[levelId]) return;
  seen[levelId] = true;
  try {
    window.localStorage.setItem(LESSON_KEY, JSON.stringify(seen));
  } catch {
    // ignore quota errors
  }
}
