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
  "05-smooth-the-burst": {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "lb", kind: "load_balancer", position: { x: 200, y: 0 } },
      { id: "s1", kind: "server", position: { x: 400, y: -60 } },
      { id: "s2", kind: "server", position: { x: 400, y: 60 } },
      { id: "q", kind: "queue", position: { x: 600, y: 0 } },
      { id: "d", kind: "database", position: { x: 800, y: 0 } },
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "lb" },
      { id: "e2", fromNodeId: "lb", toNodeId: "s1" },
      { id: "e3", fromNodeId: "lb", toNodeId: "s2" },
      { id: "e4", fromNodeId: "s1", toNodeId: "q" },
      { id: "e5", fromNodeId: "s2", toNodeId: "q" },
      { id: "e6", fromNodeId: "q", toNodeId: "d" },
    ],
  },
  "06-async-writes": {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "lb", kind: "load_balancer", position: { x: 200, y: 0 } },
      { id: "s1", kind: "server", position: { x: 400, y: -90 } },
      { id: "s2", kind: "server", position: { x: 400, y: -30 } },
      { id: "s3", kind: "server", position: { x: 400, y: 30 } },
      { id: "s4", kind: "server", position: { x: 400, y: 90 } },
      { id: "q", kind: "queue", position: { x: 600, y: 0 } },
      { id: "d", kind: "database", position: { x: 800, y: 0 } },
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "lb" },
      { id: "e2", fromNodeId: "lb", toNodeId: "s1" },
      { id: "e3", fromNodeId: "lb", toNodeId: "s2" },
      { id: "e4", fromNodeId: "lb", toNodeId: "s3" },
      { id: "e5", fromNodeId: "lb", toNodeId: "s4" },
      { id: "e6", fromNodeId: "s1", toNodeId: "q" },
      { id: "e7", fromNodeId: "s2", toNodeId: "q" },
      { id: "e8", fromNodeId: "s3", toNodeId: "q" },
      { id: "e9", fromNodeId: "s4", toNodeId: "q" },
      { id: "e10", fromNodeId: "q", toNodeId: "d" },
    ],
  },
  "07-shard-the-database": {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "lb", kind: "load_balancer", position: { x: 200, y: 0 } },
      { id: "s1", kind: "server", position: { x: 400, y: -90 } },
      { id: "s2", kind: "server", position: { x: 400, y: -30 } },
      { id: "s3", kind: "server", position: { x: 400, y: 30 } },
      { id: "s4", kind: "server", position: { x: 400, y: 90 } },
      { id: "sh", kind: "shard", position: { x: 600, y: 0 } },
      { id: "d1", kind: "database", position: { x: 800, y: -90 } },
      { id: "d2", kind: "database", position: { x: 800, y: -30 } },
      { id: "d3", kind: "database", position: { x: 800, y: 30 } },
      { id: "d4", kind: "database", position: { x: 800, y: 90 } },
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "lb" },
      { id: "e2", fromNodeId: "lb", toNodeId: "s1" },
      { id: "e3", fromNodeId: "lb", toNodeId: "s2" },
      { id: "e4", fromNodeId: "lb", toNodeId: "s3" },
      { id: "e5", fromNodeId: "lb", toNodeId: "s4" },
      { id: "e6", fromNodeId: "s1", toNodeId: "sh" },
      { id: "e7", fromNodeId: "s2", toNodeId: "sh" },
      { id: "e8", fromNodeId: "s3", toNodeId: "sh" },
      { id: "e9", fromNodeId: "s4", toNodeId: "sh" },
      { id: "e10", fromNodeId: "sh", toNodeId: "d1" },
      { id: "e11", fromNodeId: "sh", toNodeId: "d2" },
      { id: "e12", fromNodeId: "sh", toNodeId: "d3" },
      { id: "e13", fromNodeId: "sh", toNodeId: "d4" },
      { id: "e14", fromNodeId: "s1", toNodeId: "c" },
      { id: "e15", fromNodeId: "s2", toNodeId: "c" },
      { id: "e16", fromNodeId: "s3", toNodeId: "c" },
      { id: "e17", fromNodeId: "s4", toNodeId: "c" },
    ],
  },
  "08-read-write-split": {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "lb", kind: "load_balancer", position: { x: 200, y: 0 } },
      { id: "s1", kind: "server", position: { x: 400, y: -90 } },
      { id: "s2", kind: "server", position: { x: 400, y: -30 } },
      { id: "s3", kind: "server", position: { x: 400, y: 30 } },
      { id: "s4", kind: "server", position: { x: 400, y: 90 } },
      { id: "ca", kind: "cache", position: { x: 600, y: -50 } },
      { id: "q", kind: "queue", position: { x: 600, y: 50 } },
      { id: "d", kind: "database", position: { x: 800, y: 0 } },
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "lb" },
      { id: "e2", fromNodeId: "lb", toNodeId: "s1" },
      { id: "e3", fromNodeId: "lb", toNodeId: "s2" },
      { id: "e4", fromNodeId: "lb", toNodeId: "s3" },
      { id: "e5", fromNodeId: "lb", toNodeId: "s4" },
      { id: "e6", fromNodeId: "s1", toNodeId: "ca", cacheHitRate: 0.85 },
      { id: "e7", fromNodeId: "s2", toNodeId: "ca", cacheHitRate: 0.85 },
      { id: "e8", fromNodeId: "s3", toNodeId: "q" },
      { id: "e9", fromNodeId: "s4", toNodeId: "q" },
      { id: "e10", fromNodeId: "ca", toNodeId: "d" },
      { id: "e11", fromNodeId: "q", toNodeId: "d" },
      { id: "e12", fromNodeId: "s1", toNodeId: "c" },
      { id: "e13", fromNodeId: "s2", toNodeId: "c" },
    ],
  },
  "09-open-ended-scale": {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "lb", kind: "load_balancer", position: { x: 200, y: 0 } },
      { id: "s1", kind: "server", position: { x: 400, y: -90 } },
      { id: "s2", kind: "server", position: { x: 400, y: -30 } },
      { id: "s3", kind: "server", position: { x: 400, y: 30 } },
      { id: "s4", kind: "server", position: { x: 400, y: 90 } },
      { id: "ca", kind: "cache", position: { x: 600, y: -60 } },
      { id: "q", kind: "queue", position: { x: 600, y: 60 } },
      { id: "sh", kind: "shard", position: { x: 800, y: 0 } },
      { id: "d1", kind: "database", position: { x: 1000, y: -60 } },
      { id: "d2", kind: "database", position: { x: 1000, y: 0 } },
      { id: "d3", kind: "database", position: { x: 1000, y: 60 } },
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "lb" },
      { id: "e2", fromNodeId: "lb", toNodeId: "s1" },
      { id: "e3", fromNodeId: "lb", toNodeId: "s2" },
      { id: "e4", fromNodeId: "lb", toNodeId: "s3" },
      { id: "e5", fromNodeId: "lb", toNodeId: "s4" },
      { id: "e6", fromNodeId: "s1", toNodeId: "ca", cacheHitRate: 0.8 },
      { id: "e7", fromNodeId: "s2", toNodeId: "ca", cacheHitRate: 0.8 },
      { id: "e8", fromNodeId: "s3", toNodeId: "q" },
      { id: "e9", fromNodeId: "s4", toNodeId: "q" },
      { id: "e10", fromNodeId: "ca", toNodeId: "sh" },
      { id: "e11", fromNodeId: "q", toNodeId: "sh" },
      { id: "e12", fromNodeId: "sh", toNodeId: "d1" },
      { id: "e13", fromNodeId: "sh", toNodeId: "d2" },
      { id: "e14", fromNodeId: "sh", toNodeId: "d3" },
      { id: "e15", fromNodeId: "s1", toNodeId: "c" },
      { id: "e16", fromNodeId: "s2", toNodeId: "c" },
    ],
  },
  "10-replicate-and-failover": {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "s", kind: "server", position: { x: 200, y: 0 } },
      {
        id: "db1",
        kind: "database",
        position: { x: 400, y: -50 },
        replicaGroupId: "g1",
        role: "primary",
      },
      {
        id: "db2",
        kind: "database",
        position: { x: 400, y: 50 },
        replicaGroupId: "g1",
        role: "replica",
      },
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "s" },
      { id: "e2", fromNodeId: "s", toNodeId: "db1" },
      { id: "e3", fromNodeId: "db1", toNodeId: "s" },
      { id: "e4", fromNodeId: "s", toNodeId: "c" },
    ],
  },
  "11-tame-the-spike": {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      {
        id: "rl",
        kind: "rate_limiter",
        position: { x: 200, y: 0 },
        config: { tokensPerTick: 10, bucketSize: 20 },
      },
      { id: "s", kind: "server", position: { x: 400, y: 0 } },
      { id: "d", kind: "database", position: { x: 600, y: 0 } },
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "rl" },
      { id: "e2", fromNodeId: "rl", toNodeId: "s" },
      { id: "e3", fromNodeId: "s", toNodeId: "d" },
      { id: "e4", fromNodeId: "s", toNodeId: "rl" },
      { id: "e5", fromNodeId: "rl", toNodeId: "c" },
    ],
  },
  "12-trip-the-breaker": {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "s", kind: "server", position: { x: 200, y: 0 } },
      {
        id: "cb",
        kind: "circuit_breaker",
        position: { x: 400, y: 0 },
        config: { failureRateThreshold: 0.3, windowTicks: 6, cooldownTicks: 25 },
      },
      { id: "d", kind: "database", position: { x: 600, y: 0 } },
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "s" },
      { id: "e2", fromNodeId: "s", toNodeId: "cb" },
      { id: "e3", fromNodeId: "cb", toNodeId: "d" },
      { id: "e4", fromNodeId: "d", toNodeId: "cb" },
      { id: "e5", fromNodeId: "cb", toNodeId: "s" },
      { id: "e6", fromNodeId: "s", toNodeId: "c" },
    ],
  },
  "13-letters-that-wouldnt-send": {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "s", kind: "server", position: { x: 200, y: 0 } },
      { id: "q", kind: "queue", position: { x: 400, y: 0 } },
      { id: "d", kind: "database", position: { x: 600, y: -50 } },
      { id: "dlq", kind: "database", position: { x: 600, y: 50 } },
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "s" },
      { id: "e2", fromNodeId: "s", toNodeId: "q" },
      { id: "e3", fromNodeId: "q", toNodeId: "d" },
      { id: "e4", fromNodeId: "q", toNodeId: "dlq", dlq: true },
      { id: "e5", fromNodeId: "s", toNodeId: "c" },
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
      // Headroom guard: canonical solution should pass with at least 5%
      // margin on the success-rate SLA. Catches knife-edge tunings.
      expect(
        sim.metrics.successRate,
        `${level.id} success rate ${sim.metrics.successRate} too close to SLA ${level.simulation.sla.minSuccessRate}`,
      ).toBeGreaterThanOrEqual(level.simulation.sla.minSuccessRate + 0.05);
    });
  }
});
