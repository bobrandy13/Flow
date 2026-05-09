"use client";

import { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { Diagram, DiagramEdge, DiagramNode, Position } from "@flow/shared/types/diagram";
import type { ComponentKind } from "@flow/shared/types/components";
import type { EdgeTransition, NodeRuntimeSnapshot } from "@flow/shared/types/validation";
import { COMPONENT_KINDS } from "@flow/shared/types/components";
import { ComponentNode, type ComponentNodeData } from "./nodes/ComponentNode";
import { ParticleLayer } from "./ParticleLayer";
import { DEFAULT_CACHE_HIT_RATE } from "@flow/shared/engine/component-specs";

interface DiagramCanvasProps {
  diagram: Diagram;
  onChange: (next: Diagram) => void;
  onSelectionChange?: (sel: { nodeId?: string; edgeId?: string }) => void;
  /** Called when a palette item is dropped onto the canvas. */
  onDropComponent?: (kind: ComponentKind, position: Position) => void;
  /** Per-node live runtime snapshots (from streaming sim). */
  runtimeByNodeId?: Record<string, NodeRuntimeSnapshot>;
  /** Latest tick's edge transitions (from streaming sim). */
  transitions?: EdgeTransition[];
}

export const PALETTE_DRAG_MIME = "application/x-flow-component";

const nodeTypes: NodeTypes = { component: ComponentNode };

function isComponentKind(s: string): s is ComponentKind {
  return (COMPONENT_KINDS as readonly string[]).includes(s);
}

function toRfEdge(e: DiagramEdge, kindOf: (id: string) => ComponentKind | undefined): Edge {
  const targetIsCache = kindOf(e.toNodeId) === "cache";
  return {
    id: e.id,
    source: e.fromNodeId,
    target: e.toNodeId,
    label: targetIsCache && e.cacheHitRate != null ? `hit ${Math.round(e.cacheHitRate * 100)}%` : undefined,
    animated: false,
  };
}

function DiagramCanvasInner({ diagram, onChange, onSelectionChange, onDropComponent, runtimeByNodeId, transitions }: DiagramCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  /**
   * Cache of node dimensions measured by React Flow's internal ResizeObserver.
   * The canvas is fully controlled (rfNodes are derived from `diagram`), so
   * without this cache RF re-measures every render, leaving nodes permanently
   * `visibility: hidden` after a drop. We re-attach `measured` on each render
   * and update the cache when dimension changes flow through.
   */
  const measuredRef = useRef(new Map<string, { width: number; height: number }>());
  // Selection is also kept in a ref because the canvas is fully controlled —
  // re-deriving rfNodes from `diagram` would otherwise drop the `selected`
  // flag and clear the selection on every position/dimension change, making
  // the inspector flash and disappear immediately after a click.
  const selectedNodesRef = useRef(new Set<string>());
  const selectedEdgesRef = useRef(new Set<string>());

  const kindOf = useCallback(
    (id: string) => diagram.nodes.find((n) => n.id === id)?.kind,
    [diagram.nodes],
  );

  // We deliberately read measuredRef during render: we need to re-attach the
  // latest measurements every render so React Flow doesn't flash dropped nodes
  // to visibility:hidden by re-measuring on every diagram update.
  /* eslint-disable react-hooks/refs */
  const measured = measuredRef.current;
  const selectedNodes = selectedNodesRef.current;
  const selectedEdges = selectedEdgesRef.current;
  const rfNodes: Node<ComponentNodeData>[] = [];
  for (const n of diagram.nodes) {
    const m = measured.get(n.id);
    rfNodes.push({
      id: n.id,
      type: "component",
      position: n.position,
      data: { kind: n.kind, runtime: runtimeByNodeId?.[n.id] },
      selected: selectedNodes.has(n.id),
      ...(m ? { measured: m, width: m.width, height: m.height } : {}),
    });
  }
  const rfEdges: Edge[] = [];
  const activeEdgeIds = new Set<string>();
  if (transitions) for (const t of transitions) activeEdgeIds.add(t.edgeId);
  for (const e of diagram.edges) {
    rfEdges.push({
      ...toRfEdge(e, kindOf),
      selected: selectedEdges.has(e.id),
      animated: activeEdgeIds.has(e.id),
    });
  }
  /* eslint-enable react-hooks/refs */

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Capture any dimension measurements RF reports so we can re-attach them
      // on subsequent renders.
      for (const c of changes) {
        if (c.type === "dimensions" && c.dimensions) {
          measuredRef.current.set(c.id, {
            width: c.dimensions.width,
            height: c.dimensions.height,
          });
        }
        if (c.type === "remove") {
          measuredRef.current.delete(c.id);
        }
      }

      // Only round-trip through our diagram model for changes that carry
      // semantic state (position, removal). Pure RF-internal churn
      // (dimensions, select) must NOT trigger a setDiagram or we re-derive
      // rfNodes from scratch and clobber what RF just measured.
      const meaningful = changes.filter(
        (c) => c.type === "position" || c.type === "remove" || c.type === "replace" || c.type === "add",
      );
      if (meaningful.length === 0) return;

      // Build a minimal input for applyNodeChanges from diagram.nodes (NOT
      // rfNodes) so this callback doesn't need to re-create on every render.
      const input: Node<ComponentNodeData>[] = diagram.nodes.map((n) => ({
        id: n.id,
        type: "component",
        position: n.position,
        data: { kind: n.kind },
      }));
      const updated = applyNodeChanges(meaningful, input);
      const removedIds = new Set(
        meaningful
          .filter((c): c is Extract<NodeChange, { type: "remove" }> => c.type === "remove")
          .map((c) => c.id),
      );
      const nextNodes: DiagramNode[] = updated.map((n) => {
        const existing = diagram.nodes.find((dn) => dn.id === n.id);
        return {
          id: n.id,
          kind: (n.data as ComponentNodeData)?.kind ?? existing?.kind ?? "server",
          position: { x: n.position.x, y: n.position.y },
          config: existing?.config,
        };
      });
      const nextEdges = removedIds.size
        ? diagram.edges.filter((e) => !removedIds.has(e.fromNodeId) && !removedIds.has(e.toNodeId))
        : diagram.edges;
      onChange({ nodes: nextNodes, edges: nextEdges });
    },
    [diagram.edges, diagram.nodes, onChange],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const input: Edge[] = diagram.edges.map((e) => ({
        id: e.id,
        source: e.fromNodeId,
        target: e.toNodeId,
      }));
      const updated = applyEdgeChanges(changes, input);
      const survivingIds = new Set(updated.map((e) => e.id));
      const nextEdges = diagram.edges.filter((e) => survivingIds.has(e.id));
      onChange({ nodes: diagram.nodes, edges: nextEdges });
    },
    [diagram.edges, diagram.nodes, onChange],
  );

  const handleConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target || conn.source === conn.target) return;
      const exists = diagram.edges.some((e) => e.fromNodeId === conn.source && e.toNodeId === conn.target);
      if (exists) return;
      const newEdge: DiagramEdge = {
        id: `e_${Math.random().toString(36).slice(2, 9)}`,
        fromNodeId: conn.source,
        toNodeId: conn.target,
        cacheHitRate: kindOf(conn.target) === "cache" ? DEFAULT_CACHE_HIT_RATE : undefined,
      };
      onChange({ nodes: diagram.nodes, edges: [...diagram.edges, newEdge] });
    },
    [diagram.edges, diagram.nodes, kindOf, onChange],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    if (!event.dataTransfer.types.includes(PALETTE_DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      const raw = event.dataTransfer.getData(PALETTE_DRAG_MIME);
      if (!raw || !isComponentKind(raw)) return;
      event.preventDefault();
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      onDropComponent?.(raw, position);
    },
    [onDropComponent, screenToFlowPosition],
  );

  // Bumped on every selection change to force a re-render that re-attaches
  // `selected: true` from selectedNodesRef/selectedEdgesRef onto rfNodes/rfEdges.
  const [, setSelectionTick] = useState(0);
  const handleSelectionChange = useCallback(
    (sel: { nodes: { id: string }[]; edges: { id: string }[] }) => {
      const nextNodes = new Set(sel.nodes.map((n) => n.id));
      const nextEdges = new Set(sel.edges.map((e) => e.id));
      const sameNodes =
        nextNodes.size === selectedNodesRef.current.size &&
        [...nextNodes].every((id) => selectedNodesRef.current.has(id));
      const sameEdges =
        nextEdges.size === selectedEdgesRef.current.size &&
        [...nextEdges].every((id) => selectedEdgesRef.current.has(id));
      if (sameNodes && sameEdges) return;
      selectedNodesRef.current = nextNodes;
      selectedEdgesRef.current = nextEdges;
      setSelectionTick((t) => t + 1);
      onSelectionChange?.({
        nodeId: sel.nodes[0]?.id,
        edgeId: sel.edges[0]?.id,
      });
    },
    [onSelectionChange],
  );

  return (
    <div
      ref={wrapperRef}
      style={{ width: "100%", height: "100%" }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        colorMode="dark"
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onSelectionChange={handleSelectionChange}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background />
        <Controls />
        <MiniMap
          pannable
          zoomable
          style={{ background: "#111827" }}
          maskColor="rgba(11, 16, 32, 0.7)"
          nodeColor={() => "#374151"}
        />
        <ParticleLayer transitions={transitions} />
      </ReactFlow>
    </div>
  );
}

export function DiagramCanvas(props: DiagramCanvasProps) {
  return (
    <ReactFlowProvider>
      <DiagramCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
