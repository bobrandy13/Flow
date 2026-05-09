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
  /**
   * Replica grouping (databases only, for now). All nodes sharing a
   * `replicaGroupId` are treated as interchangeable read endpoints by the
   * simulator. Exactly one member should have `role: "primary"`; the rest
   * are `role: "replica"`.
   */
  replicaGroupId?: string;
  role?: "primary" | "replica";
}

/**
 * A directed edge connecting two nodes.
 * `cacheHitRate` is only meaningful when the target node is a `cache`; the UI
 * hides the field otherwise. Value is in [0, 1].
 *
 * `dlq` marks this edge as the queue's dead-letter route. When set on an edge
 * whose `fromNodeId` is a queue, queue overflow drops route to the edge's
 * target instead of being silently lost.
 */
export interface DiagramEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  cacheHitRate?: number;
  dlq?: boolean;
}

export interface Diagram {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export const emptyDiagram = (): Diagram => ({ nodes: [], edges: [] });
