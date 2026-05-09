import { describe, it, expect } from "vitest";
import { LEVELS, getLevel } from "../levels";

describe("levels", () => {
  it("has unique ids", () => {
    const ids = LEVELS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("exposes lookup by id", () => {
    const l = getLevel(LEVELS[0].id);
    expect(l).toBeDefined();
    expect(getLevel("does-not-exist")).toBeUndefined();
  });

  it("each level has at least one rule and a workload", () => {
    for (const l of LEVELS) {
      expect(l.rules.length).toBeGreaterThan(0);
      expect(l.simulation.workload.ticks).toBeGreaterThan(0);
      expect(l.allowedComponents).toContain("client");
    }
  });
});
