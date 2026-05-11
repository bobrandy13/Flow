"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentKind } from "@flow/shared/types/components";
import type { Diagram, DiagramNode } from "@flow/shared/types/diagram";
import { emptyDiagram } from "@flow/shared/types/diagram";
import { DEFAULT_FAN_OUT } from "@flow/shared/engine/component-specs";

function uid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface UseDiagramEditorOpts {
  /** Starting diagram (defaults to empty). */
  initialDiagram?: Diagram;
  /** Per-kind max counts (optional — sandbox has none, levels have caps). */
  maxOf?: Partial<Record<ComponentKind, number>>;
}

export interface DiagramEditorState {
  diagram: Diagram;
  setDiagram: React.Dispatch<React.SetStateAction<Diagram>>;
  /** Wraps a diagram update with an undo snapshot. Use for discrete actions. */
  handleDiagramChange: (next: Diagram) => void;
  /** Manually snapshot current diagram for undo (call at drag-start, before structural changes). */
  snapshotForUndo: () => void;
  /** Pop the last undo snapshot. */
  handleUndo: () => void;
  /** Add a node of the given kind at the given position. */
  addNode: (kind: ComponentKind, position?: { x: number; y: number }) => void;
  /** Reset diagram to empty and clear undo history. */
  handleReset: () => void;
  selectedNodeId: string | undefined;
  setSelectedNodeId: (id: string | undefined) => void;
  selectedEdgeId: string | undefined;
  setSelectedEdgeId: (id: string | undefined) => void;
}

/**
 * Reusable diagram editor state — undo history, add/remove nodes, selection.
 * Used by both the level play page and the sandbox page.
 */
export function useDiagramEditor(opts?: UseDiagramEditorOpts): DiagramEditorState {
  const [diagram, setDiagram] = useState<Diagram>(opts?.initialDiagram ?? emptyDiagram);
  const historyRef = useRef<Diagram[]>([]);

  const snapshotForUndo = useCallback(() => {
    setDiagram((current) => {
      historyRef.current = [...historyRef.current.slice(-49), current];
      return current;
    });
  }, []);

  const handleDiagramChange = useCallback((next: Diagram) => {
    setDiagram((current) => {
      historyRef.current = [...historyRef.current.slice(-49), current];
      return next;
    });
  }, []);

  const handleUndo = useCallback(() => {
    const history = historyRef.current;
    if (history.length === 0) return;
    historyRef.current = history.slice(0, -1);
    setDiagram(history[history.length - 1]);
  }, []);

  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | undefined>();

  const addNode = useCallback(
    (kind: ComponentKind, position?: { x: number; y: number }) => {
      const maxOf = opts?.maxOf;
      setDiagram((current) => {
        if (maxOf) {
          const cap = maxOf[kind];
          if (cap !== undefined) {
            const count = current.nodes.filter((n) => n.kind === kind).length;
            if (count >= cap) return current;
          }
        }
        const node: DiagramNode = {
          id: uid("n"),
          kind,
          position: position ?? {
            x: 80 + current.nodes.length * 40,
            y: 80 + (current.nodes.length % 5) * 40,
          },
          config: kind === "load_balancer" ? { fanOut: DEFAULT_FAN_OUT } : undefined,
        };
        const next = { nodes: [...current.nodes, node], edges: current.edges };
        historyRef.current = [...historyRef.current.slice(-49), current];
        return next;
      });
    },
    [opts?.maxOf],
  );

  const handleReset = useCallback(() => {
    historyRef.current = [];
    setDiagram(emptyDiagram());
    setSelectedNodeId(undefined);
    setSelectedEdgeId(undefined);
  }, []);

  // Global keyboard shortcuts: Cmd/Ctrl+Z for undo, Backspace/Delete for edge deletion.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((e.key === "Backspace" || e.key === "Delete") && selectedEdgeId) {
        e.preventDefault();
        setDiagram((d) => {
          historyRef.current = [...historyRef.current.slice(-49), d];
          return {
            nodes: d.nodes,
            edges: d.edges.filter((edge) => edge.id !== selectedEdgeId),
          };
        });
        setSelectedEdgeId(undefined);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleUndo, selectedEdgeId]);

  return {
    diagram,
    setDiagram,
    handleDiagramChange,
    snapshotForUndo,
    handleUndo,
    addNode,
    handleReset,
    selectedNodeId,
    setSelectedNodeId,
    selectedEdgeId,
    setSelectedEdgeId,
  };
}
