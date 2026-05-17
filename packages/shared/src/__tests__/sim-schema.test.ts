import { describe, it, expect } from "vitest";
import {
  simulationInputSchema,
  simulationResultSchema,
  MAX_FRAMES,
} from "../schemas/sim";

const validInput = () => ({
  diagram: {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "s", kind: "server", position: { x: 100, y: 0 } },
    ],
    edges: [{ id: "e1", fromNodeId: "c", toNodeId: "s" }],
  },
  workload: { requestsPerTick: 5, ticks: 50 },
  sla: { minSuccessRate: 0.9, maxP95Latency: 100 },
  seed: 1,
});

describe("simulationInputSchema", () => {
  it("accepts a minimal valid payload", () => {
    expect(() => simulationInputSchema.parse(validInput())).not.toThrow();
  });

  it("rejects unknown component kinds", () => {
    const bad = validInput() as unknown as {
      diagram: { nodes: { kind: string }[] };
    };
    bad.diagram.nodes[1].kind = "loadbalancer";
    expect(() => simulationInputSchema.parse(bad)).toThrow();
  });

  it("rejects out-of-range cacheHitRate", () => {
    const bad = validInput() as unknown as {
      diagram: { edges: Record<string, unknown>[] };
    };
    bad.diagram.edges[0] = { ...bad.diagram.edges[0], cacheHitRate: 1.5 };
    expect(() => simulationInputSchema.parse(bad)).toThrow();
  });

  it("rejects unrealistic workloads (over the per-field caps)", () => {
    const bad = validInput();
    bad.workload.requestsPerTick = 100000;
    expect(() => simulationInputSchema.parse(bad)).toThrow();
  });

  it("rejects diagrams that exceed the 50-node cap", () => {
    const bad = validInput();
    bad.diagram.nodes = Array.from({ length: 51 }, (_, i) => ({
      id: `n${i}`,
      kind: "server" as const,
      position: { x: i, y: 0 },
    }));
    expect(() => simulationInputSchema.parse(bad)).toThrow();
  });

  it("rejects an SLA with successRate > 1", () => {
    const bad = validInput();
    bad.sla.minSuccessRate = 1.5;
    expect(() => simulationInputSchema.parse(bad)).toThrow();
  });

  it("rejects extra fields in node config (strict)", () => {
    const bad = validInput() as unknown as {
      diagram: { nodes: Record<string, unknown>[] };
    };
    bad.diagram.nodes[1] = {
      ...bad.diagram.nodes[1],
      config: { fanOut: "round_robin", evilField: 42 },
    };
    expect(() => simulationInputSchema.parse(bad)).toThrow();
  });
});

describe("simulationResultSchema", () => {
  const minimalResult = () => ({
    frames: [
      {
        tick: 0,
        perNode: {
          n: {
            inFlight: 0,
            peakInFlight: 0,
            utilization: 0,
            servedTotal: 0,
            droppedTotal: 0,
            servedThisTick: 0,
            droppedThisTick: 0,
            pendingDepth: 0,
            peakPendingDepth: 0,
          },
        },
        transitions: [],
        metricsSoFar: { avgLatency: 0, p95Latency: 0, successRate: 1, drops: 0 },
        phase: "steady" as const,
      },
    ],
    outcome: {
      passed: true,
      metrics: { avgLatency: 1, p95Latency: 2, successRate: 1, drops: 0 },
      diagnosis: {
        category: "passed_clean" as const,
        headline: "Clean pass",
        explanation: "",
        culpritNodeIds: [],
        evidence: [],
        suggestions: [],
      },
    },
  });

  it("accepts a minimal valid result", () => {
    const result = minimalResult();
    expect(() => simulationResultSchema.parse(result)).not.toThrow();
  });

  it("adds a friendly diagnosis when an older response omits diagnosis", () => {
    const result = minimalResult();
    delete (result.outcome as { diagnosis?: unknown }).diagnosis;

    const parsed = simulationResultSchema.parse(result);

    expect(parsed.outcome.diagnosis).toMatchObject({
      category: "passed_clean",
      headline: "Simulation completed",
    });
  });
});

describe("MAX_FRAMES", () => {
  it("is set to a sane ceiling", () => {
    expect(MAX_FRAMES).toBeGreaterThanOrEqual(1000);
    expect(MAX_FRAMES).toBeLessThanOrEqual(10000);
  });
});
