import { describe, it, expect } from "vitest";
import { simulateStream } from "../simulation/simulator";
import type { Diagram } from "../types/diagram";
import type { TickFrame } from "../types/validation";

/** Drain the streaming simulator and return the final TickFrame (which carries
 *  per-node served totals at the end of the run). */
function runAndGetLastFrame(input: Parameters<typeof simulateStream>[0]): TickFrame {
  const stream = simulateStream(input);
  let last: TickFrame | undefined;
  for (let r = stream.next(); !r.done; r = stream.next()) {
    last = r.value;
  }
  if (!last) throw new Error("simulator yielded no frames");
  return last;
}

/**
 * A shard with consistent_hash routing must send the same logical request
 * to the same downstream shard every time. We can't observe per-request
 * routing directly from the public sim API, but we CAN observe its
 * consequences: across many requests, traffic should be evenly distributed
 * across N shards (within statistical noise) — and the distribution should
 * be deterministic for a given seed.
 */
describe("consistent_hash fan-out", () => {
  function shardedDiagram(numShards: number): Diagram {
    return {
      nodes: [
        { id: "c", kind: "client", position: { x: 0, y: 0 } },
        { id: "sh", kind: "shard", position: { x: 200, y: 0 } },
        ...Array.from({ length: numShards }, (_, i) => ({
          id: `db${i}`,
          kind: "database" as const,
          position: { x: 400, y: i * 80 },
        })),
      ],
      edges: [
        { id: "ec", fromNodeId: "c", toNodeId: "sh" },
        ...Array.from({ length: numShards }, (_, i) => ({
          id: `e${i}`,
          fromNodeId: "sh",
          toNodeId: `db${i}`,
        })),
      ],
    };
  }

  it("distributes traffic across shards (no shard gets less than half its fair share)", () => {
    const last = runAndGetLastFrame({
      diagram: shardedDiagram(4),
      workload: { requestsPerTick: 20, ticks: 100 },
      sla: { minSuccessRate: 0, maxP95Latency: 1000 },
      seed: 42,
    });
    const perShard = [0, 1, 2, 3].map((i) => last.perNode[`db${i}`]?.servedTotal ?? 0);
    const total = perShard.reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(0);
    const fair = total / 4;
    for (const s of perShard) {
      expect(s).toBeGreaterThan(fair * 0.5);
      expect(s).toBeLessThan(fair * 1.6);
    }
  });

  it("is deterministic across runs with the same seed", () => {
    const a = runAndGetLastFrame({
      diagram: shardedDiagram(3),
      workload: { requestsPerTick: 10, ticks: 50 },
      sla: { minSuccessRate: 0, maxP95Latency: 1000 },
      seed: 7,
    });
    const b = runAndGetLastFrame({
      diagram: shardedDiagram(3),
      workload: { requestsPerTick: 10, ticks: 50 },
      sla: { minSuccessRate: 0, maxP95Latency: 1000 },
      seed: 7,
    });
    for (const id of ["db0", "db1", "db2"]) {
      expect(a.perNode[id]?.servedTotal).toBe(b.perNode[id]?.servedTotal);
    }
  });
});

