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

  it("uses the canonical dark background token (#0b1020)", () => {
    expect(css.toLowerCase()).toContain("#0b1020");
  });
});
