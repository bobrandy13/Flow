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
  diagnosis: {
    category: "node_overloaded",
    headline: "Your Server ran out of capacity",
    explanation: "",
    culpritNodeIds: ["s"],
    evidence: [],
    suggestions: [],
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
    expect(text).toContain("Server"); // bottleneck node kind
  });

  it("explicitly notes 'no drops, peak inFlight = cap is fine' when 0 drops", () => {
    const happy: SimulationOutcome = {
      passed: true,
      metrics: { avgLatency: 4, p95Latency: 5, successRate: 1, drops: 0 },
      diagnosis: {
        category: "passed_clean",
        headline: "Clean pass",
        explanation: "",
        culpritNodeIds: [],
        evidence: [],
        suggestions: [],
      },
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

  it("formats long ids without merging columns and explains queue consumers", () => {
    const diagram: Diagram = {
      nodes: [
        { id: "queue-with-a-long-id", kind: "queue", position: { x: 0, y: 0 } },
        { id: "db-replica-x1keqm", kind: "database", position: { x: 0, y: 0 } },
      ],
      edges: [{ id: "e1", fromNodeId: "queue-with-a-long-id", toNodeId: "db-replica-x1keqm" }],
    };
    const happy: SimulationOutcome = {
      passed: true,
      metrics: { avgLatency: 5.99, p95Latency: 7, successRate: 1, drops: 0, bottleneckNodeId: "db-replica-x1keqm" },
      diagnosis: {
        category: "passed_clean",
        headline: "Clean pass",
        explanation: "",
        culpritNodeIds: [],
        evidence: [],
        suggestions: [],
      },
    };

    const text = buildSimulationLogs({
      diagram,
      outcome: happy,
      finalPerNode: {
        "queue-with-a-long-id": snap({ peakPendingDepth: 368 }),
        "db-replica-x1keqm": snap({ servedTotal: 2160, peakInFlight: 120 }),
      },
    });

    expect(text).toContain("Avg latency  : 59.9 ms (5.99 ticks)");
    expect(text).toMatch(/db-replica-x1keqm\s+Database/);
    expect(text).toContain("Queue notes");
    expect(text).toContain("consumer path is Database (db-replica-x1keqm)");
    expect(text).toContain("reached full capacity while draining the queue, but dropped nothing");
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
