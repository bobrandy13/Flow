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
}

/**
 * Service-Level Agreement the player's design must meet to pass simulation.
 */
export interface SLA {
  minSuccessRate: number;
  maxP95Latency: number;
}

export interface Level {
  id: string;
  title: string;
  brief: string;
  /**
   * Curriculum chapter this level belongs to. Levels are grouped on the
   * levels page and chapters are unlocked in order. Defaults to "Basics"
   * when unset.
   */
  chapter?: "Basics" | "Scaling" | "Composition";
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
