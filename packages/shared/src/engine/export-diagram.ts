import type { Diagram } from "../types/diagram";

/**
 * Strip volatile / cosmetic fields (positions, runtime ids) so the exported
 * JSON is compact and shareable. Two diagrams that are *structurally* the
 * same (same kinds + edge wiring) should serialize identically.
 */
export function exportDiagram(diagram: Diagram) {
  return {
    nodes: diagram.nodes.map((n) => ({
      id: n.id,
      kind: n.kind,
      ...(n.config ? { config: n.config } : {}),
    })),
    edges: diagram.edges.map((e) => ({
      id: e.id,
      from: e.fromNodeId,
      to: e.toNodeId,
      ...(typeof e.cacheHitRate === "number" ? { cacheHitRate: e.cacheHitRate } : {}),
    })),
  };
}

export function exportDiagramJson(diagram: Diagram, pretty = true): string {
  return JSON.stringify(exportDiagram(diagram), null, pretty ? 2 : 0);
}
