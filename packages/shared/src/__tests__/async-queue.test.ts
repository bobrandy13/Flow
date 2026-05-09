import { describe, it, expect } from "vitest";
import { simulate, simulateStream, QUEUE_PENDING_MAX } from "../simulation/simulator";
import type { Diagram } from "../types/diagram";
import type { SimulationInput } from "../simulation/simulator";

/**
 * Tests for the async producer-consumer queue (Phase 2.5 Stage 3, Option C).
 *
 * Topology used throughout: client → server → queue → db
 * Without the queue, the slow DB would back up the server and tank
 * success rate. The queue should ACK at ingress, smoothing the producer
 * experience while the DB drains pending work over more ticks.
 */

/**
 * Topology: client → LB → [s1, s2, s3, s4] → queue → db
 * Four servers behind a load balancer give us enough ingress throughput
 * that the DB (the real bottleneck) backs up the queue. Without enough
 * server capacity in front, the server overflows before the queue ever
 * sees any pressure and the test isn't actually exercising async behavior.
 */
const DIAGRAM: Diagram = {
  nodes: [
    { id: "c", kind: "client", position: { x: 0, y: 0 } },
    { id: "lb", kind: "load_balancer", position: { x: 0, y: 0 } },
    { id: "s1", kind: "server", position: { x: 0, y: 0 } },
    { id: "s2", kind: "server", position: { x: 0, y: 0 } },
    { id: "s3", kind: "server", position: { x: 0, y: 0 } },
    { id: "s4", kind: "server", position: { x: 0, y: 0 } },
    { id: "q", kind: "queue", position: { x: 0, y: 0 } },
    { id: "db", kind: "database", position: { x: 0, y: 0 } },
  ],
  edges: [
    { id: "e0", fromNodeId: "c", toNodeId: "lb" },
    { id: "e1", fromNodeId: "lb", toNodeId: "s1" },
    { id: "e2", fromNodeId: "lb", toNodeId: "s2" },
    { id: "e3", fromNodeId: "lb", toNodeId: "s3" },
    { id: "e4", fromNodeId: "lb", toNodeId: "s4" },
    { id: "e5", fromNodeId: "s1", toNodeId: "q" },
    { id: "e6", fromNodeId: "s2", toNodeId: "q" },
    { id: "e7", fromNodeId: "s3", toNodeId: "q" },
    { id: "e8", fromNodeId: "s4", toNodeId: "q" },
    { id: "e9", fromNodeId: "q", toNodeId: "db" },
  ],
};

const INPUT = (overrides: Partial<SimulationInput> = {}): SimulationInput => ({
  diagram: DIAGRAM,
  workload: { requestsPerTick: 50, ticks: 60 },
  sla: { minSuccessRate: 0.9, maxP95Latency: 100 },
  seed: 1,
  ...overrides,
});

describe("async queue (Option C)", () => {
  it("ACKs producers immediately so success rate stays high under DB pressure", () => {
    // 50/tick exceeds DB sustained throughput (~30/tick), but the queue
    // ingress is fast so producers should still see a high ACK rate.
    const out = simulate(INPUT());
    expect(out.metrics.successRate).toBeGreaterThanOrEqual(0.9);
  });

  /**
   * Regression: the same workload routed *synchronously* (no queue,
   * client → LB → 4 servers → db) should suffer because the DB's slower
   * service time + lower capacity backs up the servers waiting on returns.
   */
  it("REGRESSION: outperforms a sync alternative on a slow-backend workload", () => {
    const syncDiagram: Diagram = {
      nodes: [
        { id: "c", kind: "client", position: { x: 0, y: 0 } },
        { id: "lb", kind: "load_balancer", position: { x: 0, y: 0 } },
        { id: "s1", kind: "server", position: { x: 0, y: 0 } },
        { id: "s2", kind: "server", position: { x: 0, y: 0 } },
        { id: "s3", kind: "server", position: { x: 0, y: 0 } },
        { id: "s4", kind: "server", position: { x: 0, y: 0 } },
        { id: "db", kind: "database", position: { x: 0, y: 0 } },
      ],
      edges: [
        { id: "e0", fromNodeId: "c", toNodeId: "lb" },
        { id: "e1", fromNodeId: "lb", toNodeId: "s1" },
        { id: "e2", fromNodeId: "lb", toNodeId: "s2" },
        { id: "e3", fromNodeId: "lb", toNodeId: "s3" },
        { id: "e4", fromNodeId: "lb", toNodeId: "s4" },
        { id: "e5", fromNodeId: "s1", toNodeId: "db" },
        { id: "e6", fromNodeId: "s2", toNodeId: "db" },
        { id: "e7", fromNodeId: "s3", toNodeId: "db" },
        { id: "e8", fromNodeId: "s4", toNodeId: "db" },
      ],
    };
    const sync = simulate({ ...INPUT(), diagram: syncDiagram });
    const async_ = simulate(INPUT());
    expect(async_.metrics.successRate).toBeGreaterThan(sync.metrics.successRate);
  });

  it("queue pending depth grows during the burst and drains after", () => {
    const frames = Array.from(simulateStream(INPUT()));
    const pendingPerTick = frames.map((f) => f.perNode.q?.pendingDepth ?? 0);
    expect(Math.max(...pendingPerTick)).toBeGreaterThan(0);
    // Final frame should show the queue fully drained (or close to it).
    expect(pendingPerTick[pendingPerTick.length - 1]).toBeLessThan(5);
  });

  /**
   * Regression: async-origin work that reaches a terminal node (DB) must
   * NOT walk back to the client and must NOT generate a second `completed`
   * entry — otherwise success rate gets double-counted and the metric is a lie.
   */
  it("REGRESSION: async-origin work doesn't double-count completions", () => {
    const out = simulate(INPUT());
    // successRate must remain a valid probability.
    expect(out.metrics.successRate).toBeLessThanOrEqual(1);
    expect(out.metrics.successRate).toBeGreaterThanOrEqual(0);
  });

  it("queue overflow is counted as a producer-visible failure", () => {
    // Massive sustained burst far exceeding DB drain rate.
    const burst: SimulationInput = {
      ...INPUT(),
      workload: { requestsPerTick: 600, ticks: 30 },
    };
    expect(QUEUE_PENDING_MAX).toBe(1000);
    const frames = Array.from(simulateStream(burst));
    const out = simulate(burst);
    const finalQ = frames[frames.length - 1].perNode.q;
    // Either the queue itself overflowed, OR upstream nodes (server) dropped
    // because the queue couldn't keep up. Both prove the system saturated.
    const totalDrops =
      finalQ.droppedTotal + (frames[frames.length - 1].perNode.s?.droppedTotal ?? 0);
    expect(totalDrops).toBeGreaterThan(0);
    expect(out.metrics.successRate).toBeLessThan(1);
  });

  it("REGRESSION: removing the queue from a sufficient sync diagram doesn't break baseline", () => {
    // Sanity: synchronous client→server with light workload still passes.
    const lite = simulate({
      diagram: {
        nodes: [
          { id: "c", kind: "client", position: { x: 0, y: 0 } },
          { id: "s", kind: "server", position: { x: 0, y: 0 } },
        ],
        edges: [{ id: "e1", fromNodeId: "c", toNodeId: "s" }],
      },
      workload: { requestsPerTick: 5, ticks: 30 },
      sla: { minSuccessRate: 0.9, maxP95Latency: 100 },
      seed: 1,
    });
    expect(lite.metrics.successRate).toBeGreaterThanOrEqual(0.95);
  });
});
