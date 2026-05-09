import { describe, it, expect } from "vitest";
import { exportDiagram, exportDiagramJson } from "../engine/export-diagram";
import type { Diagram } from "../types/diagram";

const DIAGRAM: Diagram = {
  nodes: [
    { id: "c", kind: "client", position: { x: 100, y: 200 } },
    { id: "lb", kind: "load_balancer", position: { x: 300, y: 200 }, config: { fanOut: "round_robin" } },
    { id: "s", kind: "server", position: { x: 500, y: 200 } },
  ],
  edges: [
    { id: "e1", fromNodeId: "c", toNodeId: "lb" },
    { id: "e2", fromNodeId: "lb", toNodeId: "s" },
    { id: "e3", fromNodeId: "s", toNodeId: "c", cacheHitRate: 0.8 },
  ],
};

describe("exportDiagram", () => {
  it("omits node positions (x, y) so the JSON is share-friendly", () => {
    const out = exportDiagram(DIAGRAM);
    for (const n of out.nodes) {
      expect(n).not.toHaveProperty("position");
      expect(n).not.toHaveProperty("x");
      expect(n).not.toHaveProperty("y");
    }
  });

  it("preserves node id, kind, and config", () => {
    const out = exportDiagram(DIAGRAM);
    expect(out.nodes[1]).toEqual({
      id: "lb",
      kind: "load_balancer",
      config: { fanOut: "round_robin" },
    });
  });

  it("renames edge fromNodeId/toNodeId → from/to and keeps cacheHitRate", () => {
    const out = exportDiagram(DIAGRAM);
    expect(out.edges[0]).toEqual({ id: "e1", from: "c", to: "lb" });
    expect(out.edges[2]).toEqual({ id: "e3", from: "s", to: "c", cacheHitRate: 0.8 });
  });

  it("exportDiagramJson produces valid, round-trippable JSON", () => {
    const json = exportDiagramJson(DIAGRAM);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(exportDiagram(DIAGRAM));
  });

  /**
   * Regression: two diagrams that differ only in node positions must produce
   * identical export JSON. Otherwise share-and-compare workflows break.
   */
  it("REGRESSION: position differences don't change the export", () => {
    const moved: Diagram = {
      ...DIAGRAM,
      nodes: DIAGRAM.nodes.map((n) => ({ ...n, position: { x: 0, y: 0 } })),
    };
    expect(exportDiagramJson(moved)).toBe(exportDiagramJson(DIAGRAM));
  });
});
