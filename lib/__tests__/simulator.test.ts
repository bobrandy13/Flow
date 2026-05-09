import { describe, it, expect } from "vitest";
import { simulate } from "../simulation/simulator";
import type { Diagram } from "@/types/diagram";

const simpleDiagram: Diagram = {
  nodes: [
    { id: "c", kind: "client", position: { x: 0, y: 0 } },
    { id: "s", kind: "server", position: { x: 0, y: 0 } },
  ],
  edges: [
    { id: "e1", fromNodeId: "c", toNodeId: "s" },
    { id: "e2", fromNodeId: "s", toNodeId: "c" },
  ],
};

describe("simulator", () => {
  it("is deterministic for the same seed", () => {
    const a = simulate({
      diagram: simpleDiagram,
      workload: { requestsPerTick: 5, ticks: 30 },
      sla: { minSuccessRate: 0.5, maxP95Latency: 100 },
      seed: 42,
    });
    const b = simulate({
      diagram: simpleDiagram,
      workload: { requestsPerTick: 5, ticks: 30 },
      sla: { minSuccessRate: 0.5, maxP95Latency: 100 },
      seed: 42,
    });
    expect(a.metrics).toEqual(b.metrics);
  });

  it("returns failure when no client is present", () => {
    const noClient: Diagram = {
      nodes: [{ id: "s", kind: "server", position: { x: 0, y: 0 } }],
      edges: [],
    };
    const r = simulate({
      diagram: noClient,
      workload: { requestsPerTick: 1, ticks: 5 },
      sla: { minSuccessRate: 1, maxP95Latency: 1000 },
      seed: 1,
    });
    expect(r.passed).toBe(false);
    expect(r.failureReason).toMatch(/client/i);
  });

  it("a client→server with return edge serves requests successfully", () => {
    const r = simulate({
      diagram: simpleDiagram,
      workload: { requestsPerTick: 2, ticks: 50 },
      sla: { minSuccessRate: 0.8, maxP95Latency: 100 },
      seed: 7,
    });
    expect(r.metrics.successRate).toBeGreaterThan(0);
  });

  // Regression: previously, requests in flight at end-of-sim were force-dropped,
  // so a perfectly-correct trivial diagram failed the level-1 SLA (~88% success
  // rate). The simulator must drain in-flight requests before scoring.
  it("level 1 (5 req/tick × 50 ticks, 1 client → 1 server) hits 100% success", () => {
    const r = simulate({
      diagram: simpleDiagram,
      workload: { requestsPerTick: 5, ticks: 50 },
      sla: { minSuccessRate: 0.95, maxP95Latency: 30 },
      seed: 1,
    });
    expect(r.metrics.successRate).toBe(1);
    expect(r.passed).toBe(true);
  });
});
