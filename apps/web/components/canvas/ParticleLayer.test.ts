import { describe, it, expect } from "vitest";
import { sampleTransitionsFairly } from "./ParticleLayer";

type T = { edgeId: string; direction: "forward" | "return" };

const trans = (edgeId: string, direction: "forward" | "return", n: number): T[] =>
  Array.from({ length: n }, () => ({ edgeId, direction }));

describe("sampleTransitionsFairly", () => {
  it("returns the input untouched when under the limit", () => {
    const input = [...trans("e1", "forward", 3), ...trans("e2", "forward", 2)];
    expect(sampleTransitionsFairly(input, 10)).toEqual(input);
  });

  it("returns [] for limit <= 0 or empty input", () => {
    expect(sampleTransitionsFairly(trans("e1", "forward", 5), 0)).toEqual([]);
    expect(sampleTransitionsFairly([], 10)).toEqual([]);
  });

  it("picks at most `limit` items even when input is huge", () => {
    const input = trans("e1", "forward", 500);
    expect(sampleTransitionsFairly(input, 50)).toHaveLength(50);
  });

  /**
   * Regression: at 22 req/tick into a `client → LB → 2 servers → DB` graph,
   * the simulator emits ~22 forward injections on `e1` BEFORE any other edge
   * gets a transition. A naive `slice(0, MAX_PARTICLES)` therefore showed
   * particles ONLY on `e1` and the return path from `lb`, with the rest of
   * the diagram looking dead. Sampling must guarantee every active edge
   * appears.
   */
  it("REGRESSION: every active edge gets at least one particle when over capacity", () => {
    const input: T[] = [
      ...trans("e1", "forward", 22), // client → lb (front-loaded by simulator)
      ...trans("e2", "forward", 11), // lb → s1
      ...trans("e3", "forward", 11), // lb → s2
      ...trans("e4", "forward", 11), // s1 → db
      ...trans("e5", "forward", 11), // s2 → db
      ...trans("e1", "return", 22),
      ...trans("e2", "return", 11),
      ...trans("e3", "return", 11),
      ...trans("e4", "return", 11),
      ...trans("e5", "return", 11),
    ];
    const picked = sampleTransitionsFairly(input, 60);
    const seen = new Set(picked.map((p) => `${p.edgeId}|${p.direction}`));
    for (const e of ["e1", "e2", "e3", "e4", "e5"]) {
      expect(seen.has(`${e}|forward`)).toBe(true);
      expect(seen.has(`${e}|return`)).toBe(true);
    }
  });

  it("keeps per-bucket counts within 1 of each other (round-robin fairness)", () => {
    const input: T[] = [
      ...trans("e1", "forward", 50),
      ...trans("e2", "forward", 50),
      ...trans("e3", "forward", 50),
    ];
    const picked = sampleTransitionsFairly(input, 30);
    const counts = new Map<string, number>();
    for (const p of picked) counts.set(p.edgeId, (counts.get(p.edgeId) ?? 0) + 1);
    const values = [...counts.values()];
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
  });
});
