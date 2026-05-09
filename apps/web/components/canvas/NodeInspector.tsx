"use client";

import type { Diagram, DiagramNode } from "@flow/shared/types/diagram";
import type { FanOutPolicy } from "@flow/shared/types/components";
import type { NodeRuntimeSnapshot } from "@flow/shared/types/validation";
import { FAN_OUT_POLICIES } from "@flow/shared/types/components";
import { COMPONENT_SPECS, DEFAULT_FAN_OUT } from "@flow/shared/engine/component-specs";
import { throughputPerSecond } from "@flow/shared/engine/units";
import { ComponentInfoCard } from "./ComponentInfoCard";

interface NodeInspectorProps {
  diagram: Diagram;
  selectedNodeId?: string;
  /** Optional live runtime snapshot for the selected node, while a sim is running. */
  runtime?: NodeRuntimeSnapshot;
  onChange: (next: Diagram) => void;
}

export function NodeInspector({ diagram, selectedNodeId, runtime, onChange }: NodeInspectorProps) {
  const node = diagram.nodes.find((n) => n.id === selectedNodeId);
  if (!node) {
    return <Placeholder text="Select a node to inspect it." />;
  }
  const handleDelete = () => {
    onChange({
      nodes: diagram.nodes.filter((n) => n.id !== node.id),
      edges: diagram.edges.filter((e) => e.fromNodeId !== node.id && e.toNodeId !== node.id),
    });
  };
  return (
    <div style={panelStyle}>
      <ComponentInfoCard kind={node.kind} />
      {runtime && node.kind !== "client" && <LiveStatsPanel kind={node.kind} runtime={runtime} />}
      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 10 }}>id: {node.id}</div>
      {(node.kind === "load_balancer" || node.kind === "shard") && (
        <FanOutSelector
          value={
            (node.config as { fanOut?: FanOutPolicy } | undefined)?.fanOut
            ?? (node.kind === "shard" ? "consistent_hash" : DEFAULT_FAN_OUT)
          }
          onChange={(fanOut) => {
            const updated: DiagramNode = { ...node, config: { fanOut } };
            onChange({
              ...diagram,
              nodes: diagram.nodes.map((n) => (n.id === node.id ? updated : n)),
            });
          }}
        />
      )}
      <button onClick={handleDelete} style={deleteButtonStyle} aria-label="Delete node">
        🗑 Delete node
      </button>
    </div>
  );
}

function LiveStatsPanel({ kind, runtime }: { kind: DiagramNode["kind"]; runtime: NodeRuntimeSnapshot }) {
  const spec = COMPONENT_SPECS[kind];
  const cap = spec.capacity;
  const isUnbounded = !isFinite(cap);
  if (isUnbounded) return null;
  const pct = Math.min(1, runtime.inFlight / cap);
  const tps = throughputPerSecond(spec);
  const tpsLabel = tps >= 1000 ? `${(tps / 1000).toFixed(1)}k` : `${Math.round(tps)}`;
  const peakPct = Math.min(1, runtime.peakInFlight / cap);
  const barColor = pct < 0.6 ? "#22c55e" : pct < 0.85 ? "#f59e0b" : "#ef4444";
  const verdict =
    pct >= 0.95 ? "🔴 Overloaded — drops likely" :
    pct >= 0.7 ? "🟠 Hot — close to its limit" :
    pct > 0 ? "🟢 Healthy" :
    "💤 Idle";

  return (
    <div
      style={{
        marginTop: 12,
        padding: 10,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, letterSpacing: 0.5, marginBottom: 6 }}>
        LIVE
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.45, marginBottom: 6 }}>
        Right now: <strong>{runtime.inFlight}</strong> of <strong>{cap}</strong> slots in use
        {" "}<span style={{ opacity: 0.65 }}>({(pct * 100).toFixed(0)}% busy).</span>
      </div>
      <div
        style={{
          position: "relative",
          height: 7,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 4,
          overflow: "hidden",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${pct * 100}%`,
            background: barColor,
            transition: "width 120ms linear, background 200ms ease",
          }}
        />
        {/* Peak marker */}
        <div
          title={`Peak this run: ${runtime.peakInFlight}/${cap}`}
          style={{
            position: "absolute",
            left: `calc(${peakPct * 100}% - 1px)`,
            top: 0,
            width: 2,
            height: "100%",
            background: "rgba(255,255,255,0.55)",
          }}
        />
      </div>
      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>{verdict}</div>
      <div style={{ fontSize: 11, opacity: 0.65, lineHeight: 1.45 }}>
        At full capacity this can sustain <strong>≈ {tpsLabel} req/s</strong>
        {" "}<span style={{ opacity: 0.7 }}>({cap} slots ÷ {spec.baseLatency}-tick service time).</span>
      </div>
      {runtime.droppedTotal > 0 && (
        <div style={{ fontSize: 11, color: "#f87171", marginTop: 6 }}>
          ⚠ Dropped <strong>{runtime.droppedTotal}</strong> request{runtime.droppedTotal === 1 ? "" : "s"} so far
          {" "}<span style={{ opacity: 0.75 }}>(arrived when all slots were full).</span>
        </div>
      )}
    </div>
  );
}

function FanOutSelector({ value, onChange }: { value: FanOutPolicy; onChange: (v: FanOutPolicy) => void }) {
  return (
    <div style={{ marginTop: 10 }}>
      <label style={{ fontSize: 12, opacity: 0.7 }}>Fan-out policy</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as FanOutPolicy)}
        style={selectStyle}
      >
        {FAN_OUT_POLICIES.map((p) => (
          <option key={p} value={p}>
            {p.replace("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  padding: 12,
  background: "#0b1020",
  color: "#e5e7eb",
  borderLeft: "1px solid #1f2937",
  minWidth: 220,
};
const selectStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 4,
  padding: "6px 8px",
  background: "#111827",
  color: "#e5e7eb",
  border: "1px solid #1f2937",
  borderRadius: 6,
  fontSize: 13,
};
const deleteButtonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 12,
  padding: "8px 10px",
  background: "#7f1d1d",
  color: "#fee2e2",
  border: "1px solid #b91c1c",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};

function Placeholder({ text }: { text: string }) {
  return (
    <div style={{ ...panelStyle, fontSize: 12, opacity: 0.6 }}>{text}</div>
  );
}
