import { describe, it, expect } from "vitest";
import { LEVELS } from "@flow/shared/levels";
import { pickPrimaryCta } from "./pickPrimaryCta";
import type { ProgressMap } from "@/lib/storage/progress";

describe("pickPrimaryCta", () => {
  const firstId = LEVELS[0].id;
  const lastId = LEVELS[LEVELS.length - 1].id;

  it("first-time visitor gets 'Start your first level' to the first level's lesson", () => {
    const cta = pickPrimaryCta({});
    expect(cta.label).toMatch(/Start/i);
    expect(cta.href).toBe(`/levels/${firstId}/lesson`);
    expect(cta.subtitle).toBeUndefined();
  });

  it("partial progress gets 'Resume' linked to the next incomplete level's play page", () => {
    const progress: ProgressMap = {
      [firstId]: { completed: true },
    };
    const nextIncomplete = LEVELS.find((l) => !progress[l.id]?.completed)!;
    const cta = pickPrimaryCta(progress);
    expect(cta.label).toMatch(/Resume/i);
    expect(cta.href).toBe(`/levels/${nextIncomplete.id}/play`);
    expect(cta.subtitle).toBe(nextIncomplete.title);
  });

  it("full progress gets 'Replay levels' to the menu", () => {
    const progress: ProgressMap = Object.fromEntries(
      LEVELS.map((l) => [l.id, { completed: true }]),
    );
    const cta = pickPrimaryCta(progress);
    expect(cta.label).toMatch(/Replay/i);
    expect(cta.href).toBe("/levels");
    expect(cta.subtitle).toBeDefined();
  });

  it("treats the very last level being uncompleted as a Resume target", () => {
    // Everything done EXCEPT the last → Resume should point at the last.
    const progress: ProgressMap = Object.fromEntries(
      LEVELS.filter((l) => l.id !== lastId).map((l) => [l.id, { completed: true }]),
    );
    const cta = pickPrimaryCta(progress);
    expect(cta.label).toMatch(/Resume/i);
    expect(cta.href).toBe(`/levels/${lastId}/play`);
  });
});
