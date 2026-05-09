import type { ComponentKind } from "./components";

/**
 * Discriminated union of structural rules a level can require.
 * Evaluated by the rule-based validator BEFORE the simulation runs.
 */
export type Rule =
  | { type: "requires_kind"; kind: ComponentKind; min: number }
  | { type: "requires_path"; from: ComponentKind; to: ComponentKind }
  | { type: "forbidden"; kind: ComponentKind };

/** Result of evaluating a single rule against a player's diagram. */
export interface RuleResult {
  rule: Rule;
  passed: boolean;
  message: string;
}

/**
 * Final report surfaced to the player after Validate.
 * Structural pass/fail gates the simulation; sim metrics are only present
 * when the structural phase passes.
 */
export interface ValidationReport {
  structuralPassed: boolean;
  ruleResults: RuleResult[];
  simulation?: SimulationOutcome;
}

export interface SimulationOutcome {
  passed: boolean;
  metrics: SimulationMetrics;
  failureReason?: string;
}

export interface SimulationMetrics {
  /** Mean round-trip latency across successful requests, in ticks. */
  avgLatency: number;
  /** 95th percentile round-trip latency, in ticks. */
  p95Latency: number;
  /** Fraction of requests that returned a response in [0, 1]. */
  successRate: number;
  /** Total requests dropped (capacity exceeded). */
  drops: number;
  /** Node id with the highest peak utilization, if any. */
  bottleneckNodeId?: string;
}

/** Per-node runtime snapshot for live overlays during a streaming simulation. */
export interface NodeRuntimeSnapshot {
  /** Requests currently being served at this node. */
  inFlight: number;
  /** Highest in-flight count this node has seen this run. */
  peakInFlight: number;
  /** inFlight / capacity, in [0, 1]. 0 for unbounded (clients). */
  utilization: number;
  /** Cumulative requests served by this node since start. */
  servedTotal: number;
  /** Cumulative requests dropped by this node (capacity exceeded). */
  droppedTotal: number;
  /** Requests that finished service at this node on this tick. */
  servedThisTick: number;
  /** Requests dropped at this node on this tick. */
  droppedThisTick: number;
  /** For queue nodes: number of messages currently waiting in the queue's
   *  pending list to be consumed downstream. 0 for non-queue nodes. */
  pendingDepth: number;
  /** Highest pendingDepth observed at this node so far this run. */
  peakPendingDepth: number;
}

/** Single hop of a request from one node to another, used by the
 *  particle layer to animate flow on edges. */
export interface EdgeTransition {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  /** "forward" = request travelling outward from a client toward backend.
   *  "return"  = response travelling back along the same path to the client. */
  direction: "forward" | "return";
}

/** Single-tick snapshot yielded by `simulateStream()`. */
export interface TickFrame {
  tick: number;
  perNode: Record<string, NodeRuntimeSnapshot>;
  /** Hops that occurred on this tick (one entry per request edge-traversal). */
  transitions: EdgeTransition[];
  /** Running metrics computed from completed requests so far. */
  metricsSoFar: SimulationMetrics;
  phase: "steady" | "drain";
}
