import type { ComponentKind } from "./components";
import type { Rule } from "./validation";

/**
 * Workload definition for a level's simulation.
 */
export interface Workload {
  requestsPerTick: number;
  ticks: number;
  /**
   * Optional burst windows that multiply `requestsPerTick` while active.
   * Multiple bursts may overlap; effective multiplier is the product of all
   * active bursts at that tick. Lets levels teach back-pressure / smoothing.
   */
  bursts?: Array<{
    /** First tick (inclusive) when the burst is active. */
    atTick: number;
    /** Number of ticks the burst lasts. */
    durationTicks: number;
    /** Multiplier applied to `requestsPerTick` while active (e.g. 5 = 5x). */
    multiplier: number;
  }>;
  /**
   * Scheduled failures: deterministic per-level outage windows. The simulator
   * resolves each `target` to a single node at sim start; while the window
   * is active, that node refuses new admissions (counted as drops) and any
   * in-flight work at it ages out. Used to teach replication / failover and
   * circuit-breakers. No-op (silent) if the target doesn't match any node.
   */
  failures?: Array<{
    atTick: number;
    durationTicks: number;
    target: {
      kind: ComponentKind;
      role?: "primary" | "replica";
      /** Index into the matching nodes when multiple match. Default 0. */
      index?: number;
    };
  }>;
}

/**
 * Service-Level Agreement the player's design must meet to pass simulation.
 */
export interface SLA {
  minSuccessRate: number;
  maxP95Latency: number;
}

/** Body block within a lesson section — short paragraphs or bullet lists. */
export type LessonBlock =
  | { type: "p"; text: string }
  | { type: "bullets"; items: string[] }
  | {
      /** Highlighted callout box. `tone` controls the color band. */
      type: "callout";
      tone: "info" | "warn" | "success";
      title?: string;
      text: string;
    };

export interface LessonSection {
  heading: string;
  blocks: LessonBlock[];
}

/**
 * Pre-exercise teaching content. Rendered on `/levels/[id]/lesson` before the
 * player drops into the sandbox. Players who've already seen it skip
 * straight to the play page (with a "📖 Concept" link to revisit).
 */
export interface Lesson {
  /** One-sentence hook shown at the top under the title. */
  tagline: string;
  sections: LessonSection[];
  /**
   * Optional bottom-of-page quick-reference: short bullet list the player
   * can scan during the exercise. Mirrors the most actionable rules of thumb.
   */
  cheatsheet?: string[];
}

export interface Level {
  id: string;
  title: string;
  brief: string;
  /** Optional pre-level teaching page. */
  lesson?: Lesson;
  /**
   * Curriculum chapter this level belongs to. Levels are grouped on the
   * levels page and chapters are unlocked in order. Defaults to "Basics"
   * when unset.
   */
  chapter?: "Basics" | "Scaling" | "Composition" | "Reliability" | "Edge";
  /** Components the player is allowed to place from the palette. */
  allowedComponents: ComponentKind[];
  /** Optional cap on count per kind. */
  maxOf?: Partial<Record<ComponentKind, number>>;
  /** Structural rules evaluated before the simulation. */
  rules: Rule[];
  simulation: {
    workload: Workload;
    sla: SLA;
    /** Seed for reproducible jitter and policy randomness. */
    seed: number;
  };
}
