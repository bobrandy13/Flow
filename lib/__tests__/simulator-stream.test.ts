import { describe, it, expect } from "vitest";
import { simulate, simulateStream, type SimulationInput } from "../simulation/simulator";
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

const baseInput: SimulationInput = {
  diagram: simpleDiagram,
  workload: { requestsPerTick: 5, ticks: 30 },
  sla: { minSuccessRate: 0.9, maxP95Latency: 100 },
  seed: 42,
};

describe("simulateStream", () => {
  it("produces parity with simulate() for the same input/seed", () => {
    const stream = simulateStream(baseInput);
    let result = stream.next();
    while (!result.done) result = stream.next();
    const batch = simulate(baseInput);
    expect(result.value).toEqual(batch);
  });

  it("yields one frame per tick during the steady phase", () => {
    const stream = simulateStream(baseInput);
    const ticksSeen: number[] = [];
    let frames = 0;
    let result = stream.next();
    while (!result.done) {
      ticksSeen.push(result.value.tick);
      frames += 1;
      result = stream.next();
    }
    // Each yielded tick should be unique and monotonically increasing.
    expect(frames).toBeGreaterThanOrEqual(baseInput.workload.ticks);
    for (let i = 1; i < ticksSeen.length; i++) {
      expect(ticksSeen[i]).toBe(ticksSeen[i - 1] + 1);
    }
  });

  it("transitions phase from steady to drain at workload.ticks", () => {
    const stream = simulateStream(baseInput);
    const phases: Array<"steady" | "drain"> = [];
    let result = stream.next();
    while (!result.done) {
      phases.push(result.value.phase);
      result = stream.next();
    }
    // First N frames are steady, then any remaining drain frames.
    const firstDrainIdx = phases.indexOf("drain");
    if (firstDrainIdx !== -1) {
      expect(phases.slice(0, firstDrainIdx).every((p) => p === "steady")).toBe(true);
      expect(phases.slice(firstDrainIdx).every((p) => p === "drain")).toBe(true);
    }
    expect(phases.filter((p) => p === "steady").length).toBe(baseInput.workload.ticks);
  });

  it("perNode snapshots include all diagram nodes with valid utilization", () => {
    const stream = simulateStream(baseInput);
    const first = stream.next();
    expect(first.done).toBe(false);
    if (first.done) return;
    expect(Object.keys(first.value.perNode).sort()).toEqual(["c", "s"]);
    for (const snap of Object.values(first.value.perNode)) {
      expect(snap.utilization).toBeGreaterThanOrEqual(0);
      expect(snap.utilization).toBeLessThanOrEqual(1);
      expect(snap.inFlight).toBeGreaterThanOrEqual(0);
    }
  });

  it("emits per-edge transitions tagged with the diagram edge id", () => {
    const stream = simulateStream(baseInput);
    const seenEdgeIds = new Set<string>();
    let result = stream.next();
    while (!result.done) {
      expect(Array.isArray(result.value.transitions)).toBe(true);
      for (const t of result.value.transitions) {
        seenEdgeIds.add(t.edgeId);
      }
      result = stream.next();
    }
    // Both edges in the canonical diagram should see traffic at some point.
    expect(seenEdgeIds.has("e1")).toBe(true);
    expect(seenEdgeIds.has("e2")).toBe(true);
  });

  it("metricsSoFar grows monotonically (drops + completed never decrease)", () => {
    const stream = simulateStream(baseInput);
    let prevDrops = 0;
    let prevServed = 0;
    let result = stream.next();
    while (!result.done) {
      const m = result.value.metricsSoFar;
      const totalServed = Object.values(result.value.perNode).reduce((a, n) => a + n.servedTotal, 0);
      expect(m.drops).toBeGreaterThanOrEqual(prevDrops);
      expect(totalServed).toBeGreaterThanOrEqual(prevServed);
      prevDrops = m.drops;
      prevServed = totalServed;
      result = stream.next();
    }
  });
});
