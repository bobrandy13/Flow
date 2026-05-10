"use client";

import type { Diagram } from "@flow/shared/types/diagram";
import { color, fontFamily } from "@/lib/ui/theme";

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
  const isCacheEdge = targetKind === "cache" || targetKind === "cdn";
  const isQueueEdge = sourceKind === "queue";
  if (!isCacheEdge && !isQueueEdge) return null;

  return (
    <div style={panelStyle}>
      {isCacheEdge && (
        <>
          <div style={panelHeaderStyle}>
            ▸ {targetKind === "cdn" ? "CDN EDGE" : "CACHE EDGE"}
          </div>
          <label style={{ fontFamily: fontFamily.mono, fontSize: 11, color: color.textMuted, letterSpacing: 0.5 }}>
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
          <div style={panelHeaderStyle}>▸ QUEUE EDGE</div>
          <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8, color: color.text }}>
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
  background: "rgba(14, 26, 43, 0.92)",
  color: color.text,
  borderTop: `1px solid ${color.borderStrong}`,
  minWidth: 220,
  fontFamily: fontFamily.body,
};
const panelHeaderStyle: React.CSSProperties = {
  fontFamily: fontFamily.mono,
  fontSize: 10,
  letterSpacing: 2,
  color: color.accent,
  marginBottom: 8,
};
