import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Regression: handles were 6×6px which made connecting nodes very fiddly.
// They should be at least 14px on each side.
describe("ComponentNode handles", () => {
  const src = readFileSync(join(__dirname, "ComponentNode.tsx"), "utf8");

  // Regression: handles were 6×6px which made connecting nodes very fiddly.
  // They should be at least 10px on the short axis and tall enough to grab.
  it("source and target handles have generous click targets", () => {
    // Scope to <Handle .../> blocks only — other elements in the file (badges,
    // utilization bars, etc.) legitimately use smaller widths/heights.
    const handleBlocks = [...src.matchAll(/<Handle[\s\S]*?\/>/g)].map((m) => m[0]);
    expect(handleBlocks.length).toBeGreaterThanOrEqual(2);
    for (const block of handleBlocks) {
      const widthMatch = block.match(/width:\s*(\d+)/);
      const heightMatch = block.match(/height:\s*(\d+)/);
      expect(widthMatch, `handle is missing numeric width: ${block}`).not.toBeNull();
      expect(heightMatch, `handle is missing numeric height: ${block}`).not.toBeNull();
      expect(Number(widthMatch![1])).toBeGreaterThanOrEqual(10);
      expect(Number(heightMatch![1])).toBeGreaterThanOrEqual(16);
    }
  });

  // Regression: handles must NOT overlap the node body horizontally, otherwise
  // clicks on the node edge get captured by the handle and node selection
  // breaks. Each handle's box must be positioned entirely outside the node
  // edge (negative left/right offset >= its own width).
  it("handles sit entirely outside the node body so they don't steal clicks", () => {
    // Extract each <Handle .../> block separately so unrelated `right:`/`left:`
    // offsets elsewhere in the file (e.g. badges) don't get matched.
    const handleBlocks = [...src.matchAll(/<Handle[\s\S]*?\/>/g)].map((m) => m[0]);
    expect(handleBlocks.length).toBeGreaterThanOrEqual(2);
    for (const block of handleBlocks) {
      const offset = Number(block.match(/(?:left|right):\s*-(\d+)/)?.[1] ?? 0);
      const width = Number(block.match(/width:\s*(\d+)/)?.[1] ?? 0);
      expect(offset, `handle offset must be >= width in block: ${block}`).toBeGreaterThanOrEqual(width);
    }
  });

  it("renders both a source and a target Handle", () => {
    expect(src).toMatch(/type="target"/);
    expect(src).toMatch(/type="source"/);
  });
});
