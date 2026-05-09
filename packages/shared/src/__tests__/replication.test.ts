import { describe, it, expect } from "vitest";
import { simulateStream } from "../simulation/simulator";
import type { Diagram } from "../types/diagram";

/**
 * Replication regression tests. Without replica-group routing, a single
 * database is the bottleneck and requests pile up at it. With two databases
 * sharing a `replicaGroupId`, admissions should spread across the group and
 * aggregate served-count should roughly double — this catches a regression
 * where the group is ignored and only the picked node is hit.
 */

function makeDiagram(replicated: boolean): Diagram {
  const groupId = replicated ? "g1" : undefined;
  return {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "s", kind: "server", position: { x: 0, y: 0 } },
      {
        id: "db1",
        kind: "database",
        position: { x: 0, y: 0 },
        replicaGroupId: groupId,
        role: replicated ? "primary" : undefined,
      },
      ...(replicated
        ? [
            {
              id: "db2",
              kind: "database" as const,
              position: { x: 0, y: 0 },
              replicaGroupId: groupId,
              role: "replica" as const,
            },
          ]
        : []),
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "s" },
      { id: "e2", fromNodeId: "s", toNodeId: "db1" },
      { id: "e3", fromNodeId: "db1", toNodeId: "s" },
      { id: "e4", fromNodeId: "s", toNodeId: "c" },
    ],
  };
}

describe("replication routing", () => {
  it("spreads admissions across the replica group (db2 is hit)", () => {
    const diagram = makeDiagram(true);
    let db1Served = 0;
    let db2Served = 0;
    const gen = simulateStream({
      diagram,
      workload: { requestsPerTick: 80, ticks: 40 },
      sla: { minSuccessRate: 0.5, maxP95Latency: 1000 },
      seed: 1,
    });
    for (const frame of gen) {
      const a = frame.perNode["db1"];
      const b = frame.perNode["db2"];
      if (a) db1Served = a.servedTotal;
      if (b) db2Served = b.servedTotal;
    }
    expect(db1Served).toBeGreaterThan(0);
    expect(db2Served).toBeGreaterThan(0);
    // Least-loaded picking should keep them within the same order of magnitude.
    const ratio = Math.max(db1Served, db2Served) / Math.min(db1Served, db2Served);
    expect(ratio).toBeLessThan(3);
  });

  it("without a replica group, db2 is never hit (sanity baseline)", () => {
    // Two databases NOT sharing a replicaGroupId: only one is reachable from
    // the server (the other has no incoming edge). This guards against the
    // engine accidentally fanning out to ungrouped peers.
    const diagram: Diagram = {
      nodes: [
        { id: "c", kind: "client", position: { x: 0, y: 0 } },
        { id: "s", kind: "server", position: { x: 0, y: 0 } },
        { id: "db1", kind: "database", position: { x: 0, y: 0 } },
        { id: "db2", kind: "database", position: { x: 0, y: 0 } },
      ],
      edges: [
        { id: "e1", fromNodeId: "c", toNodeId: "s" },
        { id: "e2", fromNodeId: "s", toNodeId: "db1" },
        { id: "e3", fromNodeId: "db1", toNodeId: "s" },
        { id: "e4", fromNodeId: "s", toNodeId: "c" },
      ],
    };
    const gen = simulateStream({
      diagram,
      workload: { requestsPerTick: 20, ticks: 30 },
      sla: { minSuccessRate: 0.5, maxP95Latency: 1000 },
      seed: 7,
    });
    let last;
    for (const f of gen) last = f;
    expect(last!.perNode["db1"].servedTotal).toBeGreaterThan(0);
    expect(last!.perNode["db2"].servedTotal).toBe(0);
  });
});
