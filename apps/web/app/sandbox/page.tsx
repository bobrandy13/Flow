"use client";

import { useCallback, useMemo, useState } from "react";

import { DiagramCanvas } from "@/components/canvas/DiagramCanvas";
import { ComponentPalette } from "@/components/canvas/ComponentPalette";
import { NodeInspector } from "@/components/canvas/NodeInspector";
import { EdgeInspector } from "@/components/canvas/EdgeInspector";
import { ResizableSidePanel } from "@/components/canvas/ResizableSidePanel";
import { SimulationResults } from "@/components/sim/SimulationResults";
import { SaveLoadBar } from "@/components/sandbox/SaveLoadBar";

import { COMPONENT_KINDS } from "@flow/shared/types/components";
import type { ComponentKind } from "@flow/shared/types/components";
import { canSimulate } from "@flow/shared/engine/simulatability";
import { COMPONENT_SPECS } from "@flow/shared/engine/component-specs";
import { useDiagramEditor } from "@/lib/hooks/useDiagramEditor";
import { useSimulation } from "@/lib/hooks/useSimulation";
import { color, fontFamily } from "@/lib/ui/theme";
import type { Diagram } from "@flow/shared/types/diagram";
import { emptyDiagram } from "@flow/shared/types/diagram";

const DEFAULT_WORKLOAD = {
  requestsPerTick: 2,
  ticks: 120,
};

const DEFAULT_SLA = {
  minSuccessRate: 0.5,
  maxP95Latency: 100,
};

export default function SandboxPage() {
  const {
    diagram,
    setDiagram,
    handleDiagramChange,
    snapshotForUndo,
    addNode,
    handleReset: resetDiagram,
    selectedNodeId,
    setSelectedNodeId,
    selectedEdgeId,
    setSelectedEdgeId,
  } = useDiagramEditor();

  const [designName, setDesignName] = useState("");

  const simInput = useMemo(() => {
    if (!canSimulate(diagram)) return null;
    return {
      diagram,
      workload: DEFAULT_WORKLOAD,
      sla: DEFAULT_SLA,
      seed: 42,
    };
  }, [diagram]);

  const sim = useSimulation(simInput);

  const handleAdd = useCallback((kind: ComponentKind) => addNode(kind), [addNode]);
  const handleDropComponent = useCallback(
    (kind: ComponentKind, position: { x: number; y: number }) => addNode(kind, position),
    [addNode],
  );

  const handleRunSimulation = useCallback(() => {
    if (!canSimulate(diagram)) return;
    sim.reset();
    Promise.resolve().then(() => sim.play());
  }, [diagram, sim]);

  const handleNew = useCallback(() => {
    resetDiagram();
    setDesignName("");
    sim.reset();
  }, [resetDiagram, sim]);

  const handleLoad = useCallback(
    (loaded: Diagram, name: string) => {
      handleDiagramChange(loaded);
      setDesignName(name);
      sim.reset();
    },
    [handleDiagramChange, sim],
  );

  const nodeLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const n of diagram.nodes) {
      map[n.id] = `${COMPONENT_SPECS[n.kind].emoji} ${COMPONENT_SPECS[n.kind].label}`;
    }
    return map;
  }, [diagram.nodes]);

  const componentCounts = useMemo(() => {
    const counts: Partial<Record<ComponentKind, number>> = {};
    for (const n of diagram.nodes) {
      counts[n.kind] = (counts[n.kind] ?? 0) + 1;
    }
    return counts;
  }, [diagram.nodes]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 37px)", background: color.paper }}>
      {/* Header */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: `1px solid ${color.borderStrong}`,
          background: "rgba(14, 26, 43, 0.92)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: fontFamily.display,
            fontSize: 18,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: color.text,
          }}
        >
          Sandbox
        </h1>
        <span style={{ fontFamily: fontFamily.mono, fontSize: 11, color: color.textMuted, letterSpacing: 1 }}>
          FREE-FORM DESIGN · NO RULES
        </span>
      </div>

      <SaveLoadBar
        currentName={designName}
        onNameChange={setDesignName}
        diagram={diagram}
        onLoad={handleLoad}
        onNew={handleNew}
      />

      {/* Toolbar — just Run Simulation + Reset */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "8px 12px",
          borderBottom: `1px solid ${color.borderStrong}`,
          background: "rgba(19, 36, 58, 0.7)",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={handleRunSimulation}
          disabled={!canSimulate(diagram) || sim.isRunning}
          style={{
            ...pillBtn,
            opacity: !canSimulate(diagram) ? 0.5 : 1,
            cursor: !canSimulate(diagram) ? "not-allowed" : "pointer",
          }}
        >
          ▶ Run Simulation
        </button>
        <button type="button" onClick={handleNew} style={{ ...pillBtn, background: "transparent", color: color.text, border: `1px solid ${color.borderStrong}` }}>
          ↺ Reset
        </button>
        {sim.isRunning && (
          <button type="button" onClick={sim.pause} style={pillBtn}>⏸ Pause</button>
        )}
        {sim.frame && (
          <span style={{ fontFamily: fontFamily.mono, fontSize: 11, color: color.textMuted, letterSpacing: 0.5, marginLeft: "auto" }}>
            TICK <span style={{ color: color.accent }}>{sim.frame.tick.toString().padStart(4, "0")}</span>
          </span>
        )}
      </div>

      {/* Sim speed bar when running */}
      {(sim.isRunning || sim.frame) && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 14px", borderBottom: `1px solid ${color.border}`, background: "rgba(19, 36, 58, 0.5)" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: fontFamily.mono, fontSize: 11, color: color.textMuted, letterSpacing: 1 }}>
            SPEED
            <input
              type="range"
              min={1}
              max={32}
              step={1}
              value={sim.speed}
              onChange={(e) => sim.setSpeed(Number(e.target.value))}
              style={{ width: 100, accentColor: color.accent }}
            />
            <span style={{ color: color.accent, minWidth: 48 }}>{sim.speed} t/s</span>
          </label>
        </div>
      )}

      {/* Main layout */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <ComponentPalette
          allowed={[...COMPONENT_KINDS]}
          onAdd={handleAdd}
          counts={componentCounts}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <DiagramCanvas
            diagram={diagram}
            onChange={setDiagram}
            onHistorySnapshot={snapshotForUndo}
            onDropComponent={handleDropComponent}
            runtimeByNodeId={sim.frame?.perNode}
            transitions={sim.frame?.transitions}
            onSelectionChange={(sel) => {
              setSelectedNodeId(sel.nodeId);
              setSelectedEdgeId(sel.edgeId);
            }}
          />
        </div>
        <ResizableSidePanel>
          <div style={{ overflowY: "auto", flex: 1, padding: 0 }}>
            <NodeInspector
              diagram={diagram}
              selectedNodeId={selectedNodeId}
              runtime={selectedNodeId ? sim.frame?.perNode[selectedNodeId] : undefined}
              onChange={handleDiagramChange}
            />
            <EdgeInspector diagram={diagram} selectedEdgeId={selectedEdgeId} onChange={handleDiagramChange} />
            <SimulationResults
              report={sim.outcome ? { structuralPassed: true, ruleResults: [], simulation: sim.outcome } : null}
              nodeLabels={nodeLabels}
              liveFrame={sim.frame}
              totalTicks={DEFAULT_WORKLOAD.ticks}
            />
          </div>
        </ResizableSidePanel>
      </div>
    </div>
  );
}

const pillBtn: React.CSSProperties = {
  background: color.accent,
  color: color.accentInk,
  border: `1px solid ${color.accent}`,
  padding: "6px 14px",
  fontFamily: fontFamily.display,
  fontSize: 12,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  cursor: "pointer",
  borderRadius: 2,
};
