import { describe, it, expect } from "vitest";
import { simulateStream } from "../simulation/simulator";
import { CROSS_REGION_TICKS } from "../engine/regions";
import type { Diagram } from "../types/diagram";

const sla = { minSuccessRate: 0, maxP95Latency: 100000 };
const workload = { requestsPerTick: 1, ticks: 30 };

function lastFrame(diagram: Diagram, seed = 1) {
  const gen = simulateStream({ diagram, workload, sla, seed });
  let last;
  for (const f of gen) last = f;
  return last!;
}

/**
 * Cross-region latency: when a request hops from a node in region A to a node
 * in region B, the simulator adds CROSS_REGION_TICKS (8) to the destination's
 * dwell. Same-region or unset-region transitions cost nothing extra.
 */
describe("regions / cross-region latency", () => {
  function build(clientRegion: string | undefined, serverRegion: string | undefined): Diagram {
    return {
      nodes: [
        { id: "c", kind: "client", position: { x: 0, y: 0 }, region: clientRegion },
        { id: "s", kind: "server", position: { x: 0, y: 0 }, region: serverRegion },
      ],
      // Server has 0-jitter would be ideal but server.jitter=0.2; we use enough
      // samples + average that p95 isn't dominated by jitter noise, and the
      // CROSS_REGION_TICKS dominates the difference anyway.
      edges: [
        { id: "e1", fromNodeId: "c", toNodeId: "s" },
        { id: "e2", fromNodeId: "s", toNodeId: "c" },
      ],
    };
  }

  it("cross-region transitions add CROSS_REGION_TICKS to the round trip", () => {
    const sameRegion = lastFrame(build("us-east", "us-east"), 7);
    const crossRegion = lastFrame(build("us-east", "eu-west"), 7);
    // Round-trip pays CROSS_REGION_TICKS on the way out AND on the way back,
    // so avgLatency must grow by at least CROSS_REGION_TICKS (≥ one direction).
    // Use ≥ rather than ≈ to stay robust against jitter.
    expect(crossRegion.metricsSoFar.avgLatency).toBeGreaterThanOrEqual(
      sameRegion.metricsSoFar.avgLatency + CROSS_REGION_TICKS,
    );
  });

  it("same-region (matching strings) adds nothing", () => {
    const a = lastFrame(build("us-east", "us-east"), 7);
    const b = lastFrame(build("eu-west", "eu-west"), 7);
    // Identical apart from the region label — must produce identical metrics.
    expect(a.metricsSoFar.avgLatency).toBe(b.metricsSoFar.avgLatency);
  });

  it("undefined region on either side adds nothing (back-compat for L1–L13)", () => {
    const both = lastFrame(build(undefined, undefined), 7);
    const only = lastFrame(build("us-east", undefined), 7);
    // Unset region must NOT trigger cross-region cost — otherwise existing
    // levels would all start failing the moment a region is added anywhere.
    expect(both.metricsSoFar.avgLatency).toBe(only.metricsSoFar.avgLatency);
  });
});
