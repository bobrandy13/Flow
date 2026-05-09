"use client";

import { useEffect, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { COMPONENT_SPECS } from "@flow/shared/engine/component-specs";
import { throughputPerSecond } from "@flow/shared/engine/units";
import type { ComponentKind } from "@flow/shared/types/components";
import type { NodeRuntimeSnapshot } from "@flow/shared/types/validation";

export interface ComponentNodeData {
  kind: ComponentKind;
  label?: string;
  runtime?: NodeRuntimeSnapshot;
  replicaGroupId?: string;
  role?: "primary" | "replica";
  [key: string]: unknown;
}

/** Mix two hex colors. amount in [0, 1]; 0 = a, 1 = b. */
function mixColor(a: string, b: string, amount: number): string {
  const parse = (h: string) => {
    const v = h.replace("#", "");
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const t = Math.max(0, Math.min(1, amount));
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

export function ComponentNode({ data, selected }: NodeProps) {
  const nodeData = data as ComponentNodeData;
  const spec = COMPONENT_SPECS[nodeData.kind];
  const runtime = nodeData.runtime;
  const utilization = runtime?.utilization ?? 0;
  const dropTotal = runtime?.droppedTotal ?? 0;

  // Brief CSS-class pulse when drops increase. Tracked by the most recent
  // observed total so we can re-trigger reliably on each new drop event.
  const [pulseKey, setPulseKey] = useState(0);
  const lastDropTotalRef = useRef(0);
  useEffect(() => {
    if (dropTotal > lastDropTotalRef.current) {
      lastDropTotalRef.current = dropTotal;
      setPulseKey((k) => k + 1);
    } else if (dropTotal === 0) {
      lastDropTotalRef.current = 0;
    }
  }, [dropTotal]);

  // Tint toward red as utilization → 1. Capped at 60% red so node stays legible.
  const background = utilization > 0
    ? mixColor(spec.color, "#ef4444", utilization * 0.6)
    : spec.color;

  const isUnbounded = nodeData.kind === "client";
  const cap: number = isUnbounded ? Number.POSITIVE_INFINITY : spec.capacity;

  return (
    <div
      key={pulseKey ? `pulse-${pulseKey}` : "idle"}
      className={pulseKey ? "flow-node flow-node--drop-pulse" : "flow-node"}
      style={{
        background,
        border: selected ? "2px solid #111827" : "2px solid rgba(0,0,0,0.15)",
        borderRadius: 12,
        padding: "10px 14px",
        minWidth: 120,
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        fontFamily: "system-ui, sans-serif",
        color: "#0b1020",
        textAlign: "center",
        position: "relative",
        transition: "background 200ms ease",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: spec.color,
          width: 12,
          height: 22,
          border: "none",
          borderRadius: "12px 0 0 12px",
          left: -12,
          transform: "translateY(-50%)",
        }}
      />
      <div style={{ fontSize: 20 }}>{spec.emoji}</div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{nodeData.label ?? spec.label}</div>
      {nodeData.replicaGroupId && (
        <div
          aria-label={`replica ${nodeData.role ?? ""}`}
          title={`🔗 Replica group — ${nodeData.role === "primary" ? "primary" : "replica"}.`}
          style={{
            position: "absolute",
            top: 4,
            right: 6,
            fontSize: 11,
            background: "rgba(0,0,0,0.18)",
            borderRadius: 8,
            padding: "1px 5px",
          }}
        >
          🔗 {nodeData.role === "primary" ? "P" : "R"}
        </div>
      )}
      {runtime && !isUnbounded && (() => {
        const tps = throughputPerSecond(spec);
        const tpsLabel = tps >= 1000 ? `${(tps / 1000).toFixed(1)}k` : `${Math.round(tps)}`;
        const pct = Math.min(1, runtime.inFlight / cap);
        // Bar color ramps green → amber → red as utilization climbs.
        const barColor = pct < 0.6 ? "#22c55e" : pct < 0.85 ? "#f59e0b" : "#ef4444";
        const tipText =
          `Busy: ${runtime.inFlight} of ${cap} concurrent slots in use (${(pct * 100).toFixed(0)}% full).\n` +
          `Each request holds a slot for ~${spec.baseLatency} ticks, so this node can sustain ≈ ${tpsLabel} req/s.\n` +
          `(Capacity = how many at the same time, NOT max requests/sec.)` +
          (runtime.droppedTotal > 0 ? `\nDropped so far: ${runtime.droppedTotal}` : "");
        return (
          <div
            aria-label="utilization meter"
            title={tipText}
            style={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              cursor: "help",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 9,
                fontWeight: 600,
                opacity: 0.75,
                lineHeight: 1,
              }}
            >
              <span>{runtime.inFlight}/{cap} busy</span>
              <span style={{ opacity: 0.7 }}>~{tpsLabel}/s</span>
            </div>
            <div
              style={{
                height: 5,
                width: "100%",
                background: "rgba(0,0,0,0.18)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct * 100}%`,
                  background: barColor,
                  transition: "width 120ms linear, background 200ms ease",
                  boxShadow: pct >= 0.85 ? `0 0 6px ${barColor}` : "none",
                }}
              />
            </div>
          </div>
        );
      })()}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: spec.color,
          width: 12,
          height: 22,
          border: "none",
          borderRadius: "0 12px 12px 0",
          right: -12,
          transform: "translateY(-50%)",
        }}
      />
    </div>
  );
}
