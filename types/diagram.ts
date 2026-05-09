import type { ComponentKind, NodeConfig } from "./components";

export interface Position {
  x: number;
  y: number;
}

/** A node placed on the canvas. */
export interface DiagramNode {
  id: string;
  kind: ComponentKind;
  position: Position;
  /**
   * Optional kind-specific config (e.g. load balancer fan-out policy).
   * Narrowed by `kind` via the `NodeConfig` discriminated union.
   */
  config?: Extract<NodeConfig, { kind: ComponentKind }>["config"];
}

/**
 * A directed edge connecting two nodes.
 * `cacheHitRate` is only meaningful when the target node is a `cache`; the UI
 * hides the field otherwise. Value is in [0, 1].
 */
export interface DiagramEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  cacheHitRate?: number;
}

export interface Diagram {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export const emptyDiagram = (): Diagram => ({ nodes: [], edges: [] });
