import { describe, it, expect } from "vitest";
import { simulate } from "../simulation/simulator";
import { LEVELS_BY_ID } from "../levels";
import type { Diagram } from "../types/diagram";

/**
 * The "sandbox mode" promise to the player: you can run a level's simulation
 * with an *intentionally wrong* design and learn from the failure.
 *
 * For "Smooth the Burst", running just client → server (no queue, no DB)
 * during a 4x burst MUST produce a visible failure — drops > 0 and
 * success rate well below the SLA — so the player can see exactly why
 * the queue was needed.
 */
describe("sandbox mode (run without satisfying rules)", () => {
  it("L5 (Smooth the Burst) without a queue overflows the server", () => {
    const level = LEVELS_BY_ID["05-smooth-the-burst"];
    expect(level).toBeDefined();
    const naive: Diagram = {
      nodes: [
        { id: "c", kind: "client", position: { x: 0, y: 0 } },
        { id: "s", kind: "server", position: { x: 0, y: 0 } },
      ],
      edges: [{ id: "e1", fromNodeId: "c", toNodeId: "s" }],
    };
    const out = simulate({
      diagram: naive,
      workload: level.simulation.workload,
      sla: level.simulation.sla,
      seed: level.simulation.seed,
    });
    // It MUST fail (otherwise the level isn't teaching anything).
    expect(out.passed).toBe(false);
    expect(out.metrics.drops).toBeGreaterThan(0);
    // And it must fail by a clear margin, not by a hair.
    expect(out.metrics.successRate).toBeLessThan(level.simulation.sla.minSuccessRate);
  });

  it("L6 (Async Writes) without a queue likewise overloads the path", () => {
    const level = LEVELS_BY_ID["06-async-writes"];
    const naive: Diagram = {
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
    const out = simulate({
      diagram: naive,
      workload: level.simulation.workload,
      sla: level.simulation.sla,
      seed: level.simulation.seed,
    });
    expect(out.passed).toBe(false);
    expect(out.metrics.drops).toBeGreaterThan(0);
  });
});
