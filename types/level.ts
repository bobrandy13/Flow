import type { ComponentKind } from "./components";
import type { Rule } from "./validation";

/**
 * Workload definition for a level's simulation.
 */
export interface Workload {
  requestsPerTick: number;
  ticks: number;
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
