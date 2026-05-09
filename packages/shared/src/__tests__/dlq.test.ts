import { describe, it, expect } from "vitest";
import { simulateStream } from "../simulation/simulator";
import type { Diagram } from "../types/diagram";

/**
 * DLQ regression test. When a queue's pending list overflows and there's a
 * `dlq: true` outgoing edge, overflow messages should land at the DLQ target
 * (counted on it as servedTotal > 0), instead of vanishing.
 */

function build(withDlq: boolean): Diagram {
  return {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "s", kind: "server", position: { x: 0, y: 0 } },
      { id: "q", kind: "queue", position: { x: 0, y: 0 } },
      { id: "consumer", kind: "database", position: { x: 0, y: 0 } },
      { id: "dlq", kind: "database", position: { x: 0, y: 0 } },
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "s" },
      { id: "e2", fromNodeId: "s", toNodeId: "q" },
      { id: "e3", fromNodeId: "q", toNodeId: "consumer" },
      ...(withDlq
        ? [{ id: "e4", fromNodeId: "q", toNodeId: "dlq", dlq: true }]
        : []),
    ],
  };
}

describe("dlq", () => {
  it("overflow messages land at the DLQ when configured", () => {
    // Use a low-capacity consumer + heavy load to overflow the queue.
    // (Default QUEUE_PENDING_MAX=1000, so really push it.)
    const heavy = { requestsPerTick: 800, ticks: 50 };
    const sla = { minSuccessRate: 0.5, maxP95Latency: 1000 };
    const without = (() => {
      const gen = simulateStream({ diagram: build(false), workload: heavy, sla, seed: 1 });
      let last;
      for (const f of gen) last = f;
      return last!;
    })();
    const withDlq = (() => {
      const gen = simulateStream({ diagram: build(true), workload: heavy, sla, seed: 1 });
      let last;
      for (const f of gen) last = f;
      return last!;
    })();
    // No DLQ: dlq node is unreachable, served=0
    expect(without.perNode["dlq"].servedTotal).toBe(0);
    // With DLQ: overflow messages were forwarded to it.
    expect(withDlq.perNode["dlq"].servedTotal).toBeGreaterThan(0);
  });
});
