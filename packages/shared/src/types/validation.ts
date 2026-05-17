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
  /**
   * Back-compat one-liner mirroring `diagnosis.headline`. Kept optional so
   * older fixtures still load; new code should read `diagnosis.headline`.
   */
  failureReason?: string;
  /** Structured mentor verdict. Always present on real runs. */
  diagnosis: Diagnosis;
}

/**
 * Categories of mentor verdict the diagnostic engine can produce. Ordered
 * roughly by specificity — the cascade in `diagnose()` tries the more
 * specific probes first.
 */
export type DiagnosisCategory =
  /** A scheduled failure window hit a node with no replica/failover. */
  | "no_failover"
  /** A downstream failure cascaded upstream without a circuit breaker. */
  | "breaker_absent"
  /** A queue's pending depth saturated and drops happened at the queue. */
  | "queue_overflow"
  /** A rate limiter dropped traffic by design (often expected). */
  | "rate_limit_pressure"
  /** A single non-client node ran out of capacity and dominated drops. */
  | "node_overloaded"
  /** Success rate fine but p95 latency blown — too many serial hops. */
  | "latency_path_too_long"
  /** A cache is present but the bottleneck is downstream of it. */
  | "cache_underused"
  /** PASS but the bottleneck node spent most of the run >= 85% utilised. */
  | "headroom_thin"
  /** PASS with nothing obvious to flag. */
  | "passed_clean";

/** A single piece of numeric evidence backing a diagnosis. */
export interface DiagnosisEvidence {
  /** Short label e.g. "Database drops". */
  label: string;
  /** Pre-formatted human value e.g. "412 / 580 (71%)". */
  value: string;
}

/**
 * Mentor-style verdict on a simulation run. Produced by the pure
 * `diagnose()` function in `engine/diagnose.ts` after the run completes.
 */
export interface Diagnosis {
  category: DiagnosisCategory;
  /** One-line summary — replaces the legacy `failureReason` string. */
  headline: string;
  /** 1–3 paragraphs of plain-language explanation. */
  explanation: string;
  /** Node ids the diagnosis points at; UI resolves to labels. */
  culpritNodeIds: string[];
  /** Concrete numbers backing the diagnosis. */
  evidence: DiagnosisEvidence[];
  /** Actionable hints — pattern names, not implementation steps. */
  suggestions: string[];
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
