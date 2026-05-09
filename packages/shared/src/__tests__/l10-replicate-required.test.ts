import { describe, it, expect } from "vitest";
import { simulate } from "../simulation/simulator";
import { evaluateRules } from "../engine/validator";
import { LEVELS_BY_ID } from "../levels";
import type { Diagram } from "../types/diagram";

/**
 * L10 (Replicate & Failover) regression: a single-database topology must
 * NOT pass — neither the rules (min 2 databases) nor the simulation SLA.
 *
 * Without this guard, a player could "solve" the level with one DB by
 * coincidence of the failure-window math, defeating the entire lesson.
 */
describe("L10 single-DB topology fails", () => {
  const level = LEVELS_BY_ID["10-replicate-and-failover"];

  const singleDb: Diagram = {
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
  };

  it("rule check rejects: needs at least 2 databases", () => {
    const results = evaluateRules(singleDb, level.rules);
    const dbRule = results.find(
      (r) => r.rule.type === "requires_kind" && r.rule.kind === "database",
    );
    expect(dbRule?.passed).toBe(false);
  });

  it("simulation fails the SLA when the only DB goes down mid-run", () => {
    const sim = simulate({
      diagram: singleDb,
      workload: level.simulation.workload,
      sla: level.simulation.sla,
      seed: level.simulation.seed,
    });
    expect(
      sim.passed,
      `expected single-DB to fail SLA; got success=${sim.metrics.successRate}`,
    ).toBe(false);
  });
});
