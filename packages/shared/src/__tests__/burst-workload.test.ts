import { describe, it, expect } from "vitest";
import { simulate, simulateStream } from "../simulation/simulator";
import type { SimulationInput } from "../simulation/simulator";

const BASE: SimulationInput = {
  diagram: {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "s", kind: "server", position: { x: 0, y: 0 } },
    ],
    edges: [{ id: "e1", fromNodeId: "c", toNodeId: "s" }],
  },
  workload: { requestsPerTick: 10, ticks: 30 },
  sla: { minSuccessRate: 0.9, maxP95Latency: 100 },
  seed: 1,
};

describe("burst workload", () => {
  it("multiplies requestsPerTick during the burst window", () => {
    const burst: SimulationInput = {
      ...BASE,
      workload: {
        requestsPerTick: 10,
        ticks: 30,
        bursts: [{ atTick: 5, durationTicks: 5, multiplier: 5 }],
      },
    };
    const baseFrames = Array.from(simulateStream(BASE));
    const burstFrames = Array.from(simulateStream(burst));

    // Server inFlight during the burst window should noticeably exceed
    // the steady-state baseline. Using inFlight as a proxy for arrivals.
    const peakBase = Math.max(...baseFrames.map((f) => f.perNode.s?.inFlight ?? 0));
    const peakBurst = Math.max(...burstFrames.map((f) => f.perNode.s?.inFlight ?? 0));
    expect(peakBurst).toBeGreaterThan(peakBase * 2);
  });

  it("REGRESSION: omitting bursts behaves identically to a workload without the field", () => {
    const a = simulate(BASE);
    const b = simulate({ ...BASE, workload: { ...BASE.workload, bursts: [] } });
    expect(a.metrics).toEqual(b.metrics);
  });

  it("supports overlapping bursts (multipliers compound)", () => {
    const out = Array.from(
      simulateStream({
        ...BASE,
        workload: {
          requestsPerTick: 5,
          ticks: 20,
          bursts: [
            { atTick: 0, durationTicks: 10, multiplier: 2 },
            { atTick: 5, durationTicks: 10, multiplier: 3 }, // overlap @ ticks 5-9 → 6x
          ],
        },
      }),
    );
    // During the overlap, server inflight should clearly exceed either burst
    // alone. We sample around tick 6.
    const peak = Math.max(...out.slice(5, 10).map((f) => f.perNode.s?.inFlight ?? 0));
    expect(peak).toBeGreaterThan(20);
  });
});
