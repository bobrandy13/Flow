import { describe, it, expect } from "vitest";
import { GLOSSARY, GLOSSARY_PATTERNS } from "./terms";

describe("glossary terms", () => {
  it("has entries for all core system design terms", () => {
    const coreTerms = [
      "load balancer",
      "sharding",
      "replication",
      "cache hit",
      "queue",
      "circuit breaker",
      "latency",
      "throughput",
      "cdn",
    ];
    for (const term of coreTerms) {
      expect(GLOSSARY[term]).toBeDefined();
      expect(GLOSSARY[term].definition.length).toBeGreaterThan(20);
      expect(GLOSSARY[term].relevance.length).toBeGreaterThan(10);
    }
  });

  it("every entry has term, definition, and relevance", () => {
    for (const [key, entry] of Object.entries(GLOSSARY)) {
      expect(entry.term, `${key} missing .term`).toBeTruthy();
      expect(entry.definition, `${key} missing .definition`).toBeTruthy();
      expect(entry.relevance, `${key} missing .relevance`).toBeTruthy();
    }
  });

  it("every entry has category, eli5, and whenToUse", () => {
    const validCategories = ["component", "concept", "pattern"];
    for (const [key, entry] of Object.entries(GLOSSARY)) {
      expect(entry.eli5, `${key} missing .eli5`).toBeTruthy();
      expect(entry.category, `${key} missing .category`).toBeTruthy();
      expect(
        validCategories,
        `${key} has invalid category "${entry.category}"`,
      ).toContain(entry.category);
      expect(
        Array.isArray(entry.whenToUse),
        `${key} .whenToUse should be an array`,
      ).toBe(true);
      expect(
        entry.whenToUse.length,
        `${key} .whenToUse should have 2–4 items`,
      ).toBeGreaterThanOrEqual(2);
      expect(
        entry.whenToUse.length,
        `${key} .whenToUse should have 2–4 items`,
      ).toBeLessThanOrEqual(4);
    }
  });

  it("GLOSSARY_PATTERNS are sorted longest-first to avoid partial matches", () => {
    for (let i = 1; i < GLOSSARY_PATTERNS.length; i++) {
      expect(GLOSSARY_PATTERNS[i - 1].key.length).toBeGreaterThanOrEqual(
        GLOSSARY_PATTERNS[i].key.length,
      );
    }
  });

  it("patterns match plural forms (e.g., 'load balancers')", () => {
    const lb = GLOSSARY_PATTERNS.find((p) => p.key === "load balancer")!;
    lb.regex.lastIndex = 0;
    expect(lb.regex.test("uses load balancers to distribute")).toBe(true);
  });

  it("patterns are case-insensitive", () => {
    const shard = GLOSSARY_PATTERNS.find((p) => p.key === "sharding")!;
    shard.regex.lastIndex = 0;
    expect(shard.regex.test("Sharding is useful")).toBe(true);
  });
});
