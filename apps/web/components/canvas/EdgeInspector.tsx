"use client";

import type { Diagram } from "@flow/shared/types/diagram";

interface EdgeInspectorProps {
  diagram: Diagram;
  selectedEdgeId?: string;
  onChange: (next: Diagram) => void;
}

export function EdgeInspector({ diagram, selectedEdgeId, onChange }: EdgeInspectorProps) {
  const edge = diagram.edges.find((e) => e.id === selectedEdgeId);
  if (!edge) return null;
  const sourceKind = diagram.nodes.find((n) => n.id === edge.fromNodeId)?.kind;
  const targetKind = diagram.nodes.find((n) => n.id === edge.toNodeId)?.kind;
  const isCacheEdge = targetKind === "cache";
  const isQueueEdge = sourceKind === "queue";
  if (!isCacheEdge && !isQueueEdge) return null;

  return (
    <div style={panelStyle}>
      {isCacheEdge && (
        <>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Cache edge</div>
          <label style={{ fontSize: 12, opacity: 0.7 }}>
            Hit rate: {Math.round((edge.cacheHitRate ?? 0) * 100)}%
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={edge.cacheHitRate ?? 0}
            onChange={(e) => {
              const next = Number(e.target.value);
              onChange({
                ...diagram,
                edges: diagram.edges.map((x) =>
                  x.id === edge.id ? { ...x, cacheHitRate: next } : x,
                ),
              });
            }}
            style={{ width: "100%", marginTop: 6 }}
          />
        </>
      )}
      {isQueueEdge && (
        <>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Queue edge</div>
          <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={!!edge.dlq}
              onChange={(e) => {
                const next = e.target.checked;
                onChange({
                  ...diagram,
                  edges: diagram.edges.map((x) =>
                    x.id === edge.id ? { ...x, dlq: next } : x,
                  ),
                });
              }}
            />
            Dead-letter queue (route overflow here)
          </label>
        </>
      )}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  padding: 12,
  background: "#0b1020",
  color: "#e5e7eb",
  borderTop: "1px solid #1f2937",
  minWidth: 220,
};
