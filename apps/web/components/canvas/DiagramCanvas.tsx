"use client";

import { useCallback, useEffect, useRef } from "react";
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
  type EdgeTypes,
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
import { DeletableEdge, type DeletableEdgeData } from "./edges/DeletableEdge";
import { ParticleLayer } from "./ParticleLayer";
import { DEFAULT_CACHE_HIT_RATE } from "@flow/shared/engine/component-specs";

interface DiagramCanvasProps {
  diagram: Diagram;
  onChange: (next: Diagram) => void;
  onSelectionChange?: (sel: { nodeId?: string; edgeId?: string }) => void;
  /** Called when a palette item is dropped onto the canvas. */
  onDropComponent?: (kind: ComponentKind, position: Position) => void;
  /** Called once before a structural change (connect, delete) or drag-start so the parent can snapshot for undo. */
  onHistorySnapshot?: () => void;
  /** Per-node live runtime snapshots (from streaming sim). */
  runtimeByNodeId?: Record<string, NodeRuntimeSnapshot>;
  /** Latest tick's edge transitions (from streaming sim). */
  transitions?: EdgeTransition[];
}

export const PALETTE_DRAG_MIME = "application/x-flow-component";

const nodeTypes: NodeTypes = { component: ComponentNode };
const edgeTypes: EdgeTypes = { deletable: DeletableEdge };

function isComponentKind(s: string): s is ComponentKind {
  return (COMPONENT_KINDS as readonly string[]).includes(s);
}

function toRfEdge(
  e: DiagramEdge,
  kindOf: (id: string) => ComponentKind | undefined,
  regionOf: (id: string) => string | undefined,
): Edge {
  const targetIsCache = kindOf(e.toNodeId) === "cache" || kindOf(e.toNodeId) === "cdn";
  const fromRegion = regionOf(e.fromNodeId);
  const toRegion = regionOf(e.toNodeId);
  const crossRegion = !!(fromRegion && toRegion && fromRegion !== toRegion);
  const cacheLabel = targetIsCache && e.cacheHitRate != null
    ? `hit ${Math.round(e.cacheHitRate * 100)}%`
    : undefined;
  const midLabel = crossRegion
    ? cacheLabel
      ? `${cacheLabel} · +80ms`
      : "+80ms"
    : cacheLabel;
  return {
    id: e.id,
    source: e.fromNodeId,
    target: e.toNodeId,
    type: "deletable",
    animated: false,
    style: crossRegion
      ? { strokeDasharray: "6 4", stroke: "#a855f7", strokeWidth: 1.5 }
      : undefined,
    data: {
      midLabel,
      midLabelStyle: crossRegion ? { color: "#a855f7", fontWeight: 600 } : undefined,
    } satisfies DeletableEdgeData,
  };
}

function DiagramCanvasInner({ diagram, onChange, onSelectionChange, onDropComponent, onHistorySnapshot, runtimeByNodeId, transitions }: DiagramCanvasProps) {
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
  // Selection is also kept in a ref because the canvas is fully controlled.
  // re-deriving rfNodes from `diagram` would otherwise drop the `selected`
  // flag and clear the selection on every position/dimension change, making
  // the inspector flash and disappear immediately after a click.
  const selectedNodesRef = useRef(new Set<string>());
  const selectedEdgesRef = useRef(new Set<string>());
  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  const kindOf = useCallback(
    (id: string) => diagram.nodes.find((n) => n.id === id)?.kind,
    [diagram.nodes],
  );
  const regionOf = useCallback(
    (id: string) => diagram.nodes.find((n) => n.id === id)?.region,
    [diagram.nodes],
  );

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      onHistorySnapshot?.();
      onChange({
        nodes: diagram.nodes,
        edges: diagram.edges.filter((edge) => edge.id !== edgeId),
      });
    },
    [diagram.nodes, diagram.edges, onChange, onHistorySnapshot],
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
      data: {
        kind: n.kind,
        runtime: runtimeByNodeId?.[n.id],
        replicaGroupId: n.replicaGroupId,
        role: n.role,
        region: n.region,
      },
      selected: selectedNodes.has(n.id),
      ...(m ? { measured: m, width: m.width, height: m.height } : {}),
    });
  }
  const rfEdges: Edge[] = [];
  const activeEdgeIds = new Set<string>();
  if (transitions) for (const t of transitions) activeEdgeIds.add(t.edgeId);
  for (const e of diagram.edges) {
    const base = toRfEdge(e, kindOf, regionOf);
    const isSelected = selectedEdges.has(e.id);
    const baseData = (base.data ?? {}) as DeletableEdgeData;
    rfEdges.push({
      ...base,
      selected: isSelected,
      animated: activeEdgeIds.has(e.id),
      data: { ...baseData, onDelete: handleDeleteEdge } satisfies DeletableEdgeData,
      ...(isSelected && {
        style: {
          ...base.style,
          stroke: "#38bdf8",
          strokeWidth: 3,
          filter: "drop-shadow(0 0 5px #38bdf8)",
        },
      }),
    });
  }
  // Synthetic "tether" edges: dashed lines between members of the same
  // replica group. Visual-only: they don't exist in the diagram model and
  // are non-interactive (can't be selected, dragged, or deleted). They make
  // it obvious which databases are linked even when the player drags them
  // far apart on the canvas.
  {
    const groups = new Map<string, string[]>();
    for (const n of diagram.nodes) {
      if (!n.replicaGroupId) continue;
      const arr = groups.get(n.replicaGroupId);
      if (arr) arr.push(n.id);
      else groups.set(n.replicaGroupId, [n.id]);
    }
    for (const [groupId, memberIds] of groups) {
      if (memberIds.length < 2) continue;
      const primary = diagram.nodes.find(
        (n) => n.replicaGroupId === groupId && n.role === "primary",
      );
      const anchor = primary?.id ?? memberIds[0];
      for (const id of memberIds) {
        if (id === anchor) continue;
        rfEdges.push({
          id: `__tether__:${groupId}:${anchor}->${id}`,
          source: anchor,
          target: id,
          type: "straight",
          selectable: false,
          focusable: false,
          deletable: false,
          reconnectable: false,
          style: {
            stroke: "#a855f7",
            strokeWidth: 1.5,
            strokeDasharray: "2 4",
            opacity: 0.7,
          },
          label: "🔗",
          labelStyle: { fontSize: 10, fill: "#a855f7" },
          labelBgStyle: { fill: "#0e1a2b", fillOpacity: 0.85 },
          labelBgPadding: [2, 2],
          labelBgBorderRadius: 2,
          // Keep tether under semantic edges visually but above grid.
          zIndex: -1,
        });
      }
    }
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
      // (dimensions, select, add, replace) must NOT trigger a setDiagram or we
      // can get stuck in React Flow -> setDiagram -> React Flow loops.
      const meaningful = changes.filter(
        (c) => c.type === "position" || c.type === "remove",
      );
      if (meaningful.length === 0) return;

      // Snapshot for undo before node removals (position changes are
      // handled via onNodeDragStart instead).
      const hasRemoves = meaningful.some((c) => c.type === "remove");
      if (hasRemoves) onHistorySnapshot?.();

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
          replicaGroupId: existing?.replicaGroupId,
          role: existing?.role,
          region: existing?.region,
        };
      });
      const nextEdges = removedIds.size
        ? diagram.edges.filter((e) => !removedIds.has(e.fromNodeId) && !removedIds.has(e.toNodeId))
        : diagram.edges;
      const nodesUnchanged =
        nextNodes.length === diagram.nodes.length &&
        nextNodes.every((node, index) => {
          const current = diagram.nodes[index];
          return (
            current &&
            node.id === current.id &&
            node.kind === current.kind &&
            node.position.x === current.position.x &&
            node.position.y === current.position.y &&
            node.config === current.config &&
            node.replicaGroupId === current.replicaGroupId &&
            node.role === current.role &&
            node.region === current.region
          );
        });
      if (nodesUnchanged && nextEdges === diagram.edges) return;
      onChange({ nodes: nextNodes, edges: nextEdges });
    },
    [diagram.edges, diagram.nodes, onChange, onHistorySnapshot],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Filter out pure RF-internal churn (select), same pattern as handleNodesChange.
      const meaningful = changes.filter((c) => c.type === "remove");
      if (meaningful.length === 0) return;
      onHistorySnapshot?.();
      const input: Edge[] = diagram.edges.map((e) => ({
        id: e.id,
        source: e.fromNodeId,
        target: e.toNodeId,
      }));
      const updated = applyEdgeChanges(meaningful, input);
      const survivingIds = new Set(updated.map((e) => e.id));
      const nextEdges = diagram.edges.filter((e) => survivingIds.has(e.id));
      if (nextEdges.length === diagram.edges.length) return;
      onChange({ nodes: diagram.nodes, edges: nextEdges });
    },
    [diagram.edges, diagram.nodes, onChange, onHistorySnapshot],
  );

  const handleConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target || conn.source === conn.target) return;
      const exists = diagram.edges.some((e) => e.fromNodeId === conn.source && e.toNodeId === conn.target);
      if (exists) return;
      onHistorySnapshot?.();
      const newEdge: DiagramEdge = {
        id: `e_${Math.random().toString(36).slice(2, 9)}`,
        fromNodeId: conn.source,
        toNodeId: conn.target,
        cacheHitRate: kindOf(conn.target) === "cache" ? DEFAULT_CACHE_HIT_RATE : undefined,
      };
      onChange({ nodes: diagram.nodes, edges: [...diagram.edges, newEdge] });
    },
    [diagram.edges, diagram.nodes, kindOf, onChange, onHistorySnapshot],
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
      onSelectionChangeRef.current?.({
        nodeId: sel.nodes[0]?.id,
        edgeId: sel.edges[0]?.id,
      });
    },
    [],
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
        edgeTypes={edgeTypes}
        colorMode="dark"
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onSelectionChange={handleSelectionChange}
        onNodeDragStart={() => onHistorySnapshot?.()}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background />
        <Controls />
        <MiniMap
          pannable
          zoomable
          style={{ background: "#0e1a2b", border: "1px solid #3a5e85" }}
          maskColor="rgba(14, 26, 43, 0.7)"
          nodeColor={() => "#7adfff"}
          nodeStrokeColor="#3a5e85"
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
