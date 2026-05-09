import { describe, it, expect } from "vitest";
import { simulateStream } from "../simulation/simulator";
import { canSimulate, diagramSimulatabilityIssue } from "../engine/simulatability";
import type { Diagram } from "../types/diagram";
import type { Workload } from "../types/level";

const sla = { minSuccessRate: 0, maxP95Latency: 1000 };

function lastFrame(input: { diagram: Diagram; workload: Workload; sla: typeof sla; seed: number }) {
  const gen = simulateStream(input);
  let last;
  for (const f of gen) last = f;
  return last!;
}

describe("cdn", () => {
  it("accepts a client wired straight to a CDN as a valid entry point", () => {
    const d: Diagram = {
      nodes: [
        { id: "c", kind: "client", position: { x: 0, y: 0 } },
        { id: "cdn", kind: "cdn", position: { x: 0, y: 0 } },
        { id: "lb", kind: "load_balancer", position: { x: 0, y: 0 } },
        { id: "s", kind: "server", position: { x: 0, y: 0 } },
      ],
      edges: [
        { id: "e1", fromNodeId: "c", toNodeId: "cdn" },
        { id: "e2", fromNodeId: "cdn", toNodeId: "lb" },
        { id: "e3", fromNodeId: "lb", toNodeId: "s" },
        { id: "e4", fromNodeId: "s", toNodeId: "c" },
      ],
    };
    expect(diagramSimulatabilityIssue(d)).toBeNull();
    expect(canSimulate(d)).toBe(true);
  });

  it("short-circuits on a CDN hit (origin server sees no traffic at 100% hit rate)", () => {
    const diagram: Diagram = {
      nodes: [
        { id: "c", kind: "client", position: { x: 0, y: 0 } },
        { id: "cdn", kind: "cdn", position: { x: 0, y: 0 } },
        { id: "s", kind: "server", position: { x: 0, y: 0 } },
      ],
      edges: [
        { id: "e1", fromNodeId: "c", toNodeId: "cdn", cacheHitRate: 1 },
        { id: "e2", fromNodeId: "cdn", toNodeId: "s" },
        { id: "e3", fromNodeId: "s", toNodeId: "c" },
      ],
    };
    const last = lastFrame({ diagram, workload: { requestsPerTick: 4, ticks: 30 }, sla, seed: 1 });
    expect(last.perNode["cdn"].servedTotal).toBeGreaterThan(0);
    expect(last.perNode["s"].servedTotal).toBe(0);
  });

  it("forwards to the origin on a CDN miss (0% hit rate)", () => {
    const diagram: Diagram = {
      nodes: [
        { id: "c", kind: "client", position: { x: 0, y: 0 } },
        { id: "cdn", kind: "cdn", position: { x: 0, y: 0 } },
        { id: "s", kind: "server", position: { x: 0, y: 0 } },
      ],
      edges: [
        { id: "e1", fromNodeId: "c", toNodeId: "cdn", cacheHitRate: 0 },
        { id: "e2", fromNodeId: "cdn", toNodeId: "s" },
        { id: "e3", fromNodeId: "s", toNodeId: "c" },
      ],
    };
    const last = lastFrame({ diagram, workload: { requestsPerTick: 4, ticks: 30 }, sla, seed: 1 });
    expect(last.perNode["s"].servedTotal).toBeGreaterThan(0);
  });
});

