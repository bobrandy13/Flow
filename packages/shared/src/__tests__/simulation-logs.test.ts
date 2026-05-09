import { describe, it, expect } from "vitest";
import { buildSimulationLogs } from "../engine/simulation-logs";
import type { Diagram } from "../types/diagram";
import type { SimulationOutcome, NodeRuntimeSnapshot } from "../types/validation";

const DIAGRAM: Diagram = {
  nodes: [
    { id: "c", kind: "client", position: { x: 0, y: 0 } },
    { id: "s", kind: "server", position: { x: 0, y: 0 } },
    { id: "db", kind: "database", position: { x: 0, y: 0 } },
  ],
  edges: [
    { id: "e1", fromNodeId: "c", toNodeId: "s" },
    { id: "e2", fromNodeId: "s", toNodeId: "db" },
  ],
};

function snap(overrides: Partial<NodeRuntimeSnapshot>): NodeRuntimeSnapshot {
  return {
    inFlight: 0,
    peakInFlight: 0,
    utilization: 0,
    servedTotal: 0,
    droppedTotal: 0,
    servedThisTick: 0,
    droppedThisTick: 0,
    pendingDepth: 0,
    peakPendingDepth: 0,
    ...overrides,
  };
}

const OUTCOME: SimulationOutcome = {
  passed: false,
  metrics: {
    avgLatency: 4,
    p95Latency: 5,
    successRate: 0.748,
    drops: 545,
    bottleneckNodeId: "s",
  },
};

describe("buildSimulationLogs", () => {
  it("includes verdict, metrics, and per-node summary", () => {
    const text = buildSimulationLogs({
      levelId: "05-smooth-the-burst",
      levelTitle: "Smooth the Burst",
      diagram: DIAGRAM,
      outcome: OUTCOME,
      finalPerNode: {
        c: snap({ servedTotal: 1000 }),
        s: snap({ servedTotal: 200, droppedTotal: 545, peakInFlight: 80 }),
        db: snap({ servedTotal: 200, peakInFlight: 60 }),
      },
      sla: { minSuccessRate: 0.85, p95LatencyMaxTicks: 8 },
    });
    expect(text).toContain("FAIL");
    expect(text).toContain("Smooth the Burst");
    expect(text).toContain("74.8%");
    expect(text).toContain("Drops        : 545");
    expect(text).toContain("Drops by node");
    expect(text).toContain("server"); // bottleneck node kind
  });

  it("explicitly notes 'no drops, peak inFlight = cap is fine' when 0 drops", () => {
    const happy: SimulationOutcome = {
      passed: true,
      metrics: { avgLatency: 4, p95Latency: 5, successRate: 1, drops: 0 },
    };
    const text = buildSimulationLogs({
      diagram: DIAGRAM,
      outcome: happy,
      finalPerNode: {
        c: snap({ servedTotal: 1000 }),
        s: snap({ servedTotal: 1000, peakInFlight: 80 }),
        db: snap({ servedTotal: 1000, peakInFlight: 120 }),
      },
    });
    expect(text).toContain("no drops");
    expect(text).toMatch(/peak inFlight = capacity is fine/);
  });

  it("includes the diagram export at the end (no positions)", () => {
    const text = buildSimulationLogs({ diagram: DIAGRAM, outcome: OUTCOME });
    expect(text).toContain("--- Diagram ---");
    expect(text).not.toMatch(/"position"\s*:/);
    expect(text).toMatch(/"from":\s*"c"/);
  });

  it("lists per-tick drop events when frames are supplied", () => {
    const text = buildSimulationLogs({
      diagram: DIAGRAM,
      outcome: OUTCOME,
      frames: [
        {
          tick: 5,
          perNode: { c: snap({}), s: snap({ droppedThisTick: 3 }), db: snap({}) },
          transitions: [],
          metricsSoFar: { avgLatency: 0, p95Latency: 0, successRate: 1, drops: 0 },
          phase: "steady",
        },
      ],
    });
    expect(text).toContain("Drop events");
    expect(text).toMatch(/tick\s+5: s=3/);
  });
});
