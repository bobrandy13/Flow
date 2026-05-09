/**
 * Zod schemas for the simulation API wire format.
 *
 * These schemas are the single source of truth for everything that crosses
 * the apps/web ↔ apps/api boundary. The Fastify route validates request
 * bodies against `simulationInputSchema`; the front-end parses responses
 * against `simulationResultSchema` to catch deploy-skew bugs.
 *
 * Inferred TypeScript types are re-exported so application code never
 * touches `z.infer<...>` directly.
 */
import { z } from "zod";
import { COMPONENT_KINDS, FAN_OUT_POLICIES } from "../types/components";

// ---------- diagram ----------

const componentKindSchema = z.enum(COMPONENT_KINDS);
const fanOutPolicySchema = z.enum(FAN_OUT_POLICIES);

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Per-kind config is a discriminated union in the TS types; on the wire we
// keep it loose (object | undefined) and let the simulator interpret. Strict
// per-kind validation could land later if it ever causes bugs.
const nodeConfigSchema = z
  .object({
    fanOut: fanOutPolicySchema.optional(),
    bufferSize: z.number().int().nonnegative().optional(),
    tokensPerTick: z.number().int().min(0).max(10000).optional(),
    bucketSize: z.number().int().min(0).max(10000).optional(),
    failureRateThreshold: z.number().min(0).max(1).optional(),
    windowTicks: z.number().int().min(1).max(2000).optional(),
    cooldownTicks: z.number().int().min(1).max(2000).optional(),
  })
  .strict()
  .optional();

const diagramNodeSchema = z.object({
  id: z.string().min(1),
  kind: componentKindSchema,
  position: positionSchema,
  config: nodeConfigSchema,
  replicaGroupId: z.string().min(1).optional(),
  role: z.enum(["primary", "replica"]).optional(),
});

const diagramEdgeSchema = z.object({
  id: z.string().min(1),
  fromNodeId: z.string().min(1),
  toNodeId: z.string().min(1),
  cacheHitRate: z.number().min(0).max(1).optional(),
  dlq: z.boolean().optional(),
});

export const diagramSchema = z.object({
  nodes: z.array(diagramNodeSchema).max(50, "Diagram exceeds the 50-node cap."),
  edges: z.array(diagramEdgeSchema).max(200, "Diagram exceeds the 200-edge cap."),
});

// ---------- workload + sla ----------

const workloadSchema = z.object({
  requestsPerTick: z.number().int().min(1).max(1000),
  ticks: z.number().int().min(1).max(2000),
  bursts: z
    .array(
      z.object({
        atTick: z.number().int().min(0).max(2000),
        durationTicks: z.number().int().min(1).max(2000),
        multiplier: z.number().min(0.1).max(20),
      }),
    )
    .max(10)
    .optional(),
  failures: z
    .array(
      z.object({
        atTick: z.number().int().min(0).max(2000),
        durationTicks: z.number().int().min(1).max(2000),
        target: z.object({
          kind: componentKindSchema,
          role: z.enum(["primary", "replica"]).optional(),
          index: z.number().int().min(0).optional(),
        }),
      }),
    )
    .max(10)
    .optional(),
});

const slaSchema = z.object({
  minSuccessRate: z.number().min(0).max(1),
  maxP95Latency: z.number().min(0),
});

// ---------- simulation input (request body) ----------

export const simulationInputSchema = z.object({
  diagram: diagramSchema,
  workload: workloadSchema,
  sla: slaSchema,
  seed: z.number().int(),
});

// ---------- simulation output (response body) ----------

const simulationMetricsSchema = z.object({
  avgLatency: z.number(),
  p95Latency: z.number(),
  successRate: z.number(),
  drops: z.number().int(),
  bottleneckNodeId: z.string().optional(),
});

const simulationOutcomeSchema = z.object({
  passed: z.boolean(),
  metrics: simulationMetricsSchema,
  failureReason: z.string().optional(),
});

const nodeRuntimeSnapshotSchema = z.object({
  inFlight: z.number(),
  peakInFlight: z.number(),
  utilization: z.number(),
  servedTotal: z.number(),
  droppedTotal: z.number(),
  servedThisTick: z.number(),
  droppedThisTick: z.number(),
  pendingDepth: z.number(),
  peakPendingDepth: z.number(),
});

const edgeTransitionSchema = z.object({
  edgeId: z.string(),
  fromNodeId: z.string(),
  toNodeId: z.string(),
  direction: z.enum(["forward", "return"]),
});

const tickFrameSchema = z.object({
  tick: z.number().int(),
  perNode: z.record(z.string(), nodeRuntimeSnapshotSchema),
  transitions: z.array(edgeTransitionSchema),
  metricsSoFar: simulationMetricsSchema,
  phase: z.enum(["steady", "drain"]),
});

export const simulationResultSchema = z.object({
  frames: z.array(tickFrameSchema),
  outcome: simulationOutcomeSchema,
});

// ---------- inferred types ----------

export type SimulationInput = z.infer<typeof simulationInputSchema>;
export type SimulationResult = z.infer<typeof simulationResultSchema>;

// ---------- limits (shared with route handler + tests) ----------

/** Hard ceiling on `frames.length`. Inputs whose drained-tick count would
 *  exceed this are rejected with a 400 to prevent payload runaway. The
 *  drain horizon used by the simulator is `ticks * 4 + 200`. */
export const MAX_FRAMES = 5000;
