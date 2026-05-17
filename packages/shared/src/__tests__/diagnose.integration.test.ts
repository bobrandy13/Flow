/**
 * Integration test: for each curriculum level, build a deliberately weak
 * diagram (the minimum the structural rules might accept, or just enough
 * graph to actually run) and assert that the resulting diagnosis lands in
 * a sensible category for that level's teaching intent.
 *
 * This is intentionally lenient — categories are grouped per level into an
 * "acceptable set" rather than requiring an exact match, because the same
 * weak diagram can legitimately trigger a few related probes. The contract
 * is: the diagnosis must NOT be `passed_clean` on a deliberately weak fail,
 * and must name a meaningful root cause.
 */
import { describe, it, expect } from "vitest";
import { LEVELS } from "../levels";
import { simulate } from "../simulation/simulator";
import type { Diagram } from "../types/diagram";
import type { DiagnosisCategory } from "../types/validation";

/** Always-meaningful categories: any of these on a failed run is a win. */
const MEANINGFUL_FAIL_CATEGORIES: DiagnosisCategory[] = [
  "no_failover",
  "breaker_absent",
  "queue_overflow",
  "rate_limit_pressure",
  "node_overloaded",
  "latency_path_too_long",
  "cache_underused",
];

/** Build the weakest plausible diagram for each level — usually one client
 *  to one server, regardless of what the level asks for. The intent is to
 *  produce a failing run that the diagnostic engine has to explain. */
function weakDiagram(): Diagram {
  return {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "s", kind: "server", position: { x: 0, y: 0 } },
    ],
    edges: [
      { id: "e1", fromNodeId: "c", toNodeId: "s" },
      { id: "e2", fromNodeId: "s", toNodeId: "c" },
    ],
  };
}

describe("diagnose() — integration with curriculum levels", () => {
  for (const level of LEVELS) {
    it(`${level.id}: weak solution produces a meaningful diagnosis`, () => {
      const r = simulate({
        diagram: weakDiagram(),
        workload: level.simulation.workload,
        sla: level.simulation.sla,
        seed: level.simulation.seed,
      });
      // Diagnosis is always present.
      expect(r.diagnosis).toBeTruthy();
      expect(r.diagnosis.headline.length).toBeGreaterThan(0);
      // On a fail, the category must be one of the meaningful root-cause
      // categories — never `passed_clean` or `headroom_thin`.
      if (!r.passed) {
        expect(MEANINGFUL_FAIL_CATEGORIES).toContain(r.diagnosis.category);
        expect(r.diagnosis.suggestions.length).toBeGreaterThan(0);
      }
    });
  }

  it("failureReason mirrors diagnosis.headline for back-compat", () => {
    const level = LEVELS[0];
    const r = simulate({
      diagram: weakDiagram(),
      workload: { ...level.simulation.workload, requestsPerTick: 500 },
      sla: { minSuccessRate: 0.99, maxP95Latency: 1 },
      seed: 1,
    });
    if (!r.passed) {
      expect(r.failureReason).toBe(r.diagnosis.headline);
    }
  });
});
