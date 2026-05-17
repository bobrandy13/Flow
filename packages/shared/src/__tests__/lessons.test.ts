import { describe, it, expect } from "vitest";
import { LEVELS } from "../levels";

describe("lessons", () => {
  it("every level has a lesson with at least one section", () => {
    for (const level of LEVELS) {
      expect(level.lesson, `level ${level.id} missing lesson`).toBeTruthy();
      expect(level.lesson!.sections.length, `level ${level.id} has no sections`).toBeGreaterThan(0);
      expect(level.lesson!.tagline, `level ${level.id} missing tagline`).toBeTruthy();
    }
  });

  it("every section has at least one block, and callout blocks have valid tones", () => {
    for (const level of LEVELS) {
      for (const section of level.lesson!.sections) {
        expect(section.blocks.length, `${level.id} / ${section.heading}`).toBeGreaterThan(0);
        for (const block of section.blocks) {
          if (block.type === "callout") {
            expect(["info", "warn", "success"]).toContain(block.tone);
          } else if (block.type === "bullets") {
            expect(block.items.length).toBeGreaterThan(0);
          } else if (block.type === "definitions") {
            expect(block.items.length).toBeGreaterThan(0);
          } else if (block.type === "prereq") {
            expect(block.items.length).toBeGreaterThan(0);
          } else {
            expect((block as { text: string }).text.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  /**
   * Regression: each lesson should mention the components/concepts the level
   * actually exercises. If someone adds a new pattern to a level but forgets
   * to update the lesson, this catches it loosely.
   */
  it("each lesson body references at least one allowed component kind", () => {
    for (const level of LEVELS) {
      const haystack = JSON.stringify(level.lesson).toLowerCase();
      const matched = level.allowedComponents.some((k) =>
        haystack.includes(k.replace("_", " ")) || haystack.includes(k.replace("_", "")),
      );
      expect(matched, `lesson for ${level.id} doesn't mention any of: ${level.allowedComponents.join(", ")}`).toBe(true);
    }
  });
});
