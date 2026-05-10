import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression guards for global theming. The app is dark-themed throughout;
 * a `prefers-color-scheme: light` flip would cause "FLOW" / pages to render
 * on a white background, conflicting with the in-page dark surfaces.
 *
 * If you intentionally re-introduce light mode, add a tested theme toggle
 * before deleting these checks.
 */
describe("globals.css theme", () => {
  const css = readFileSync(join(__dirname, "globals.css"), "utf8");

  it("declares dark color-scheme on :root", () => {
    expect(css).toMatch(/color-scheme:\s*dark/);
  });

  it("does not flip background based on prefers-color-scheme: light", () => {
    expect(css).not.toMatch(/prefers-color-scheme:\s*light/);
  });

  it("uses the blueprint navy background token (#0e1a2b)", () => {
    expect(css.toLowerCase()).toContain("#0e1a2b");
  });

  it("paints a blueprint grid pattern on the body", () => {
    // Phase 3.2: the body should layer linear-gradient grid lines (the
    // 24px major + 8px minor blueprint pattern) so every page inherits
    // the paper-and-grid look without each page re-implementing it.
    expect(css).toMatch(/background-image:\s*[\s\S]*linear-gradient/);
    expect(css).toMatch(/--grid-major/);
    expect(css).toMatch(/--grid-minor/);
  });
});
