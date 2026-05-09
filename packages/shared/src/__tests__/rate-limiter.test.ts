import { describe, it, expect } from "vitest";
import { simulate } from "../simulation/simulator";
import type { Diagram } from "../types/diagram";

/**
 * Rate-limiter regression tests. Token bucket should:
 *  - drop arrivals when the bucket is empty
 *  - allow steady traffic below `tokensPerTick` indefinitely
 *  - allow bursts up to `bucketSize` before throttling kicks in.
 */

function diagramWithLimiter(tokensPerTick: number, bucketSize: number): Diagram {
  return {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      {
        id: "rl",
        kind: "rate_limiter",
        position: { x: 0, y: 0 },
        config: { tokensPerTick, bucketSize },
      },
      { id: "s", kind: "server", position: { x: 0, y: 0 } },
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "rl" },
      { id: "e2", fromNodeId: "rl", toNodeId: "s" },
      { id: "e3", fromNodeId: "s", toNodeId: "rl" },
      { id: "e4", fromNodeId: "rl", toNodeId: "c" },
    ],
  };
}

describe("rate limiter", () => {
  it("steady traffic under the limit produces no rate-limit drops", () => {
    const r = simulate({
      diagram: diagramWithLimiter(20, 40),
      workload: { requestsPerTick: 10, ticks: 50 },
      sla: { minSuccessRate: 0.9, maxP95Latency: 1000 },
      seed: 1,
    });
    expect(r.metrics.successRate).toBeGreaterThan(0.95);
  });

  it("traffic above the refill rate drops the excess", () => {
    const r = simulate({
      diagram: diagramWithLimiter(5, 5),
      workload: { requestsPerTick: 30, ticks: 60 },
      sla: { minSuccessRate: 0.5, maxP95Latency: 1000 },
      seed: 1,
    });
    // With a 5-tps refill against 30/tick demand, expect heavy drops.
    expect(r.metrics.successRate).toBeLessThan(0.4);
    expect(r.metrics.drops).toBeGreaterThan(0);
  });
});
