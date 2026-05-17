import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Regression test for the localhost:4000-in-production bug.
 *
 * Next.js inlines `process.env.NEXT_PUBLIC_*` via **literal text replacement**
 * at build time.  If the code aliases `process.env` to a variable/parameter
 * (e.g. `const env = process.env; env.NEXT_PUBLIC_X`) the replacement silently
 * fails and the value is `undefined` in the browser bundle — causing the
 * fallback to localhost.
 *
 * This test reads the source file and ensures `NEXT_PUBLIC_API_BASE_URL` is
 * only ever accessed via the literal `process.env.NEXT_PUBLIC_API_BASE_URL`
 * expression, not through any alias.
 */
describe("getSimulationApiBase – env var inlining safety", () => {
  const src = readFileSync(
    resolve(__dirname, "../useSimulation.ts"),
    "utf-8",
  );

  it("accesses NEXT_PUBLIC_API_BASE_URL only via process.env literal", () => {
    // Every occurrence of `NEXT_PUBLIC_API_BASE_URL` in the source should be
    // preceded by `process.env.`.
    const allRefs = [...src.matchAll(/\bNEXT_PUBLIC_API_BASE_URL\b/g)];
    expect(allRefs.length).toBeGreaterThan(0);

    for (const match of allRefs) {
      const idx = match.index!;
      const preceding = src.slice(Math.max(0, idx - 30), idx);
      expect(preceding).toMatch(
        /process\.env\.\s*$/,
      );
    }
  });

  it("getSimulationApiBase does not accept an env parameter", () => {
    // A parameter like `env = process.env` would break Next.js inlining.
    const fnSignature = src.match(
      /function\s+getSimulationApiBase\s*\(([^)]*)\)/,
    );
    expect(fnSignature).not.toBeNull();
    const params = fnSignature![1].trim();
    expect(params).toBe("");
  });
});
