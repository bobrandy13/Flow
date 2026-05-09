import { describe, it, expect } from "vitest";
import { simulate, simulateStream } from "../simulation/simulator";
import type { Diagram } from "../types/diagram";

/**
 * Failure-injection regression tests. Without proper window handling the
 * simulator might fail every request (window not resolved) or none (window
 * resolved but flag never read). These tests pin both ends.
 */

const baseDiagram: Diagram = {
  nodes: [
    { id: "c", kind: "client", position: { x: 0, y: 0 } },
    { id: "s", kind: "server", position: { x: 0, y: 0 } },
    { id: "db", kind: "database", position: { x: 0, y: 0 } },
  ],
  edges: [
    { id: "e1", fromNodeId: "c", toNodeId: "s" },
    { id: "e2", fromNodeId: "s", toNodeId: "db" },
    { id: "e3", fromNodeId: "db", toNodeId: "s" },
    { id: "e4", fromNodeId: "s", toNodeId: "c" },
  ],
};

describe("failure injection", () => {
  it("a scheduled DB outage produces drops during the window only", () => {
    const gen = simulateStream({
      diagram: baseDiagram,
      workload: {
        requestsPerTick: 5,
        ticks: 60,
        failures: [{ atTick: 20, durationTicks: 20, target: { kind: "database" } }],
      },
      sla: { minSuccessRate: 0.5, maxP95Latency: 1000 },
      seed: 1,
    });
    let dropsBefore = 0;
    let dropsDuring = 0;
    let dropsAfter = 0;
    let prev = 0;
    for (const f of gen) {
      const dbDrops = f.perNode["db"].droppedTotal;
      const delta = dbDrops - prev;
      prev = dbDrops;
      if (f.tick < 20) dropsBefore += delta;
      else if (f.tick < 40) dropsDuring += delta;
      else dropsAfter += delta;
    }
    expect(dropsBefore).toBe(0);
    expect(dropsDuring).toBeGreaterThan(0);
    // Recovery: no further drops once window passes (allow drain tail).
    expect(dropsAfter).toBe(0);
  });

  it("replication keeps reads flowing through a primary outage", () => {
    const replicated: Diagram = {
      nodes: [
        { id: "c", kind: "client", position: { x: 0, y: 0 } },
        { id: "s", kind: "server", position: { x: 0, y: 0 } },
        {
          id: "db1",
          kind: "database",
          position: { x: 0, y: 0 },
          replicaGroupId: "g",
          role: "primary",
        },
        {
          id: "db2",
          kind: "database",
          position: { x: 0, y: 0 },
          replicaGroupId: "g",
          role: "replica",
        },
      ],
      edges: [
        { id: "e1", fromNodeId: "c", toNodeId: "s" },
        { id: "e2", fromNodeId: "s", toNodeId: "db1" },
        { id: "e3", fromNodeId: "db1", toNodeId: "s" },
        { id: "e4", fromNodeId: "s", toNodeId: "c" },
      ],
    };
    const failure = {
      requestsPerTick: 5,
      ticks: 60,
      failures: [
        { atTick: 20, durationTicks: 20, target: { kind: "database" as const } },
      ],
    };
    const sla = { minSuccessRate: 0.5, maxP95Latency: 1000 };
    const noReplica = simulate({
      diagram: baseDiagram,
      workload: failure,
      sla,
      seed: 3,
    });
    const withReplica = simulate({
      diagram: replicated,
      workload: failure,
      sla,
      seed: 3,
    });
    expect(withReplica.metrics.successRate).toBeGreaterThan(noReplica.metrics.successRate);
  });

  it("a target that doesn't match any node is a silent no-op", () => {
    const r = simulate({
      diagram: baseDiagram,
      workload: {
        requestsPerTick: 5,
        ticks: 30,
        failures: [{ atTick: 5, durationTicks: 10, target: { kind: "cache" } }],
      },
      sla: { minSuccessRate: 0.8, maxP95Latency: 1000 },
      seed: 9,
    });
    expect(r.metrics.successRate).toBeGreaterThan(0.8);
  });
});
