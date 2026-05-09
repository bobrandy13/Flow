import { describe, it, expect } from "vitest";
import { LEVELS } from "../levels";
import { simulate } from "../simulation/simulator";
import { evaluateRules } from "../engine/validator";
import type { Diagram } from "../types/diagram";

// Regression: levels must be physically passable with the obvious "correct"
// design. Previously db throughput (cap/latency) was so low that even level 2
// couldn't hit its SLA, and level 3 capped at ~28% success.
const expectedDesigns: Record<string, Diagram> = {
  "01-hello-server": {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "s", kind: "server", position: { x: 200, y: 0 } },
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "s" },
      { id: "e2", fromNodeId: "s", toNodeId: "c" },
    ],
  },
  "02-add-a-database": {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "s", kind: "server", position: { x: 200, y: 0 } },
      { id: "d", kind: "database", position: { x: 400, y: 0 } },
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "s" },
      { id: "e2", fromNodeId: "s", toNodeId: "d" },
      { id: "e3", fromNodeId: "s", toNodeId: "c" },
    ],
  },
  "03-scale-with-load-balancer": {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "lb", kind: "load_balancer", position: { x: 200, y: 0 } },
      { id: "s1", kind: "server", position: { x: 400, y: -50 } },
      { id: "s2", kind: "server", position: { x: 400, y: 50 } },
      { id: "d", kind: "database", position: { x: 600, y: 0 } },
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "lb" },
      { id: "e2", fromNodeId: "lb", toNodeId: "s1" },
      { id: "e3", fromNodeId: "lb", toNodeId: "s2" },
      { id: "e4", fromNodeId: "s1", toNodeId: "d" },
      { id: "e5", fromNodeId: "s2", toNodeId: "d" },
      { id: "e6", fromNodeId: "s1", toNodeId: "c" },
      { id: "e7", fromNodeId: "s2", toNodeId: "c" },
    ],
  },
  "04-add-a-cache": {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "lb", kind: "load_balancer", position: { x: 200, y: 0 } },
      { id: "s1", kind: "server", position: { x: 400, y: -50 } },
      { id: "s2", kind: "server", position: { x: 400, y: 50 } },
      { id: "ca", kind: "cache", position: { x: 600, y: 0 } },
      { id: "d", kind: "database", position: { x: 800, y: 0 } },
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "lb" },
      { id: "e2", fromNodeId: "lb", toNodeId: "s1" },
      { id: "e3", fromNodeId: "lb", toNodeId: "s2" },
      { id: "e4", fromNodeId: "s1", toNodeId: "ca", cacheHitRate: 0.8 },
      { id: "e5", fromNodeId: "s2", toNodeId: "ca", cacheHitRate: 0.8 },
      { id: "e6", fromNodeId: "ca", toNodeId: "d" },
      { id: "e7", fromNodeId: "s1", toNodeId: "c" },
      { id: "e8", fromNodeId: "s2", toNodeId: "c" },
    ],
  },
};

describe("level solvability", () => {
  for (const level of LEVELS) {
    it(`${level.id} passes rules + simulation with the canonical correct design`, () => {
      const design = expectedDesigns[level.id];
      expect(design, `missing canonical design for ${level.id}`).toBeDefined();

      const ruleResults = evaluateRules(design, level.rules);
      const failedRules = ruleResults.filter((r) => !r.passed).map((r) => r.message);
      expect(failedRules, `rules failing on ${level.id}`).toEqual([]);

      const sim = simulate({
        diagram: design,
        workload: level.simulation.workload,
        sla: level.simulation.sla,
        seed: level.simulation.seed,
      });
      expect(
        sim.passed,
        `${level.id} failed sim: ${sim.failureReason} (succ=${sim.metrics.successRate}, p95=${sim.metrics.p95Latency})`,
      ).toBe(true);
    });
  }
});
