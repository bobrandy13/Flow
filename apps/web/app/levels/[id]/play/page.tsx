"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { DiagramCanvas } from "@/components/canvas/DiagramCanvas";
import { ComponentPalette } from "@/components/canvas/ComponentPalette";
import { Toolbar } from "@/components/canvas/Toolbar";
import { NodeInspector } from "@/components/canvas/NodeInspector";
import { EdgeInspector } from "@/components/canvas/EdgeInspector";
import { SimulationResults } from "@/components/sim/SimulationResults";

import { getLevel } from "@flow/shared/levels";
import { evaluateRules } from "@flow/shared/engine/validator";
import { canSimulate, diagramSimulatabilityIssue } from "@flow/shared/engine/simulatability";
import { useSimulation } from "@/lib/hooks/useSimulation";
import { recordAttempt, recordCompletion } from "@/lib/storage/progress";
import { DEFAULT_FAN_OUT, COMPONENT_SPECS } from "@flow/shared/engine/component-specs";
import { ticksToMs, formatSuccessRate } from "@flow/shared/engine/units";

import type { ComponentKind } from "@flow/shared/types/components";
import type { Diagram, DiagramNode } from "@flow/shared/types/diagram";
import { emptyDiagram } from "@flow/shared/types/diagram";
import type { ValidationReport } from "@flow/shared/types/validation";

function uid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function PlayPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const level = getLevel(params.id);

  const [diagram, setDiagram] = useState<Diagram>(emptyDiagram);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | undefined>();
  const [baseReport, setBaseReport] = useState<ValidationReport | null>(null);

  // Build the SimulationInput (or null when prerequisites aren't met). We
  // intentionally key the input by the diagram + level identity, NOT by
  // structural validity — the player should always be able to press Play and
  // see *something* happen (even a sim that produces drops because rules fail).
  const simInput = useMemo(() => {
    if (!level) return null;
    return {
      diagram,
      workload: level.simulation.workload,
      sla: level.simulation.sla,
      seed: level.simulation.seed,
    };
  }, [diagram, level]);

  const sim = useSimulation(simInput);

  // Derived: combine the structural report with the latest sim outcome.
  const report = useMemo<ValidationReport | null>(() => {
    if (!baseReport) return null;
    if (sim.outcome) return { ...baseReport, simulation: sim.outcome };
    return baseReport;
  }, [baseReport, sim.outcome]);

  const addNode = useCallback(
    (kind: ComponentKind, position?: { x: number; y: number }) => {
      if (!level) return;
      const cap = level.maxOf?.[kind];
      if (cap !== undefined) {
        const count = diagram.nodes.filter((n) => n.kind === kind).length;
        if (count >= cap) return;
      }
      const node: DiagramNode = {
        id: uid("n"),
        kind,
        position: position ?? {
          x: 80 + diagram.nodes.length * 40,
          y: 80 + (diagram.nodes.length % 5) * 40,
        },
        config: kind === "load_balancer" ? { fanOut: DEFAULT_FAN_OUT } : undefined,
      };
      setDiagram((d) => ({ nodes: [...d.nodes, node], edges: d.edges }));
    },
    [diagram.nodes, level],
  );

  const handleAdd = useCallback((kind: ComponentKind) => addNode(kind), [addNode]);
  const handleDropComponent = useCallback(
    (kind: ComponentKind, position: { x: number; y: number }) => addNode(kind, position),
    [addNode],
  );

  const handleValidate = useCallback(() => {
    if (!level) return;
    const ruleResults = evaluateRules(diagram, level.rules);
    const structuralPassed = ruleResults.every((r) => r.passed);
    setBaseReport({ structuralPassed, ruleResults });
    sim.reset();
    recordAttempt(level.id, diagram);
  }, [diagram, level, sim]);

  const handleRunSimulation = useCallback(() => {
    if (!level) return;
    const ruleResults = evaluateRules(diagram, level.rules);
    const structuralPassed = ruleResults.every((r) => r.passed);
    setBaseReport({ structuralPassed, ruleResults });
    // Always try to run the simulation — the player should be able to
    // experiment with broken or incomplete designs and watch what happens
    // (e.g. drop a queue from "Smooth the Burst" and see the server melt).
    // Completion is gated on rules + sim passing in the effect below.
    if (canSimulate(diagram)) {
      sim.reset();
      // Defer to next microtask so reset state is committed before play().
      Promise.resolve().then(() => sim.play());
    } else {
      // Truly nothing to simulate — record the attempt so the level shows
      // up as "tried" but skip the network round-trip.
      recordAttempt(level.id, diagram);
    }
  }, [diagram, level, sim]);

  // When the streaming run finishes, persist progress. Completion requires
  // BOTH the structural rules and the simulation SLA to pass — sandbox runs
  // (rules failing) only ever count as attempts.
  useEffect(() => {
    if (!sim.outcome || !level) return;
    const structuralPassed = baseReport?.structuralPassed ?? false;
    if (sim.outcome.passed && structuralPassed) {
      recordCompletion(level.id, sim.outcome.metrics, diagram);
    } else {
      recordAttempt(level.id, diagram);
    }
  }, [sim.outcome, level, diagram, baseReport]);

  const handleReset = useCallback(() => {
    setDiagram(emptyDiagram());
    setBaseReport(null);
    setSelectedNodeId(undefined);
    setSelectedEdgeId(undefined);
    sim.reset();
  }, [sim]);

  const nodeLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const n of diagram.nodes) {
      map[n.id] = `${COMPONENT_SPECS[n.kind].emoji} ${COMPONENT_SPECS[n.kind].label}`;
    }
    return map;
  }, [diagram.nodes]);

  const briefBlock = useMemo(() => {
    if (!level) return null;
    const sla = level.simulation.sla;
    const wl = level.simulation.workload;
    const reqPerSec = (wl.requestsPerTick * 1000) / ticksToMs(1);
    return (
      <div style={{ padding: 12, borderBottom: "1px solid #1f2937", background: "#0b1020", color: "#e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 1 }}>LEVEL · {level.id}</div>
            <h1 style={{ margin: "2px 0 4px", fontSize: 18 }}>{level.title}</h1>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.8, maxWidth: 720 }}>{level.brief}</p>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
              Target: <strong style={{ color: "#e5e7eb" }}>{formatSuccessRate(sla.minSuccessRate)}</strong> success
              {" · "}p95 ≤ <strong style={{ color: "#e5e7eb" }}>{ticksToMs(sla.maxP95Latency)} ms</strong>
              {" · "}load <strong style={{ color: "#e5e7eb" }}>~{reqPerSec.toFixed(0)} req/s</strong>
            </div>
          </div>
          <Link href="/levels" style={{ fontSize: 12, color: "#60a5fa" }}>← All levels</Link>
        </div>
      </div>
    );
  }, [level]);

  const simulatabilityIssue = useMemo(() => diagramSimulatabilityIssue(diagram), [diagram]);
  const isSandboxMode = baseReport !== null && !baseReport.structuralPassed;

  if (!level) {
    return (
      <div style={{ padding: 32, color: "#e5e7eb", background: "#0b1020", minHeight: "100vh" }}>
        <p>Level not found.</p>
        <button onClick={() => router.push("/levels")} style={{ marginTop: 12 }}>Back to levels</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0b1020" }}>
      {briefBlock}
      <Toolbar
        onValidate={handleValidate}
        onReset={handleReset}
        onRunSimulation={handleRunSimulation}
        isSimulating={sim.isRunning}
        runDisabled={!canSimulate(diagram)}
        runDisabledReason={simulatabilityIssue ?? undefined}
      />
      {isSandboxMode && (sim.frame || sim.outcome) && (
        <div
          role="status"
          style={{
            background: "rgba(251, 191, 36, 0.08)",
            borderBottom: "1px solid rgba(251, 191, 36, 0.3)",
            color: "#fcd34d",
            padding: "6px 16px",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>🧪</span>
          <span>
            <strong>Sandbox run.</strong> The level&apos;s rules aren&apos;t met yet, so this run won&apos;t count
            toward completion — but you can still watch what happens. Compare it to a design that satisfies the rules.
          </span>
        </div>
      )}
      {(sim.isRunning || sim.frame || sim.loading || sim.error) && (
        <div style={simBarStyle}>
          {sim.loading ? (
            <span style={{ fontSize: 12, opacity: 0.85 }}>⏳ Computing simulation…</span>
          ) : sim.isRunning ? (
            <button onClick={sim.pause} style={pillBtn}>⏸ Pause</button>
          ) : (
            <button onClick={sim.play} style={pillBtn} disabled={sim.isFinished}>▶ Play</button>
          )}
          <button onClick={sim.reset} style={pillBtn}>↺ Reset</button>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, opacity: 0.85 }}>
            Speed
            <input
              type="range"
              min={1}
              max={32}
              step={1}
              value={sim.speed}
              onChange={(e) => sim.setSpeed(Number(e.target.value))}
              style={{ width: 120 }}
            />
            <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 56 }}>
              {sim.speed} ticks/s
            </span>
          </label>
          {sim.frame && (
            <span style={{ fontSize: 12, opacity: 0.75 }}>
              tick {sim.frame.tick} · {sim.frame.phase}
            </span>
          )}
          {sim.error && (
            <span
              role="alert"
              style={{
                fontSize: 12,
                color: "#ef4444",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: 4,
                padding: "2px 8px",
              }}
            >
              ⚠ {sim.error}{" "}
              <button
                onClick={() => { sim.reset(); sim.play(); }}
                style={{ ...pillBtn, padding: "2px 8px", fontSize: 11, marginLeft: 6 }}
              >
                Retry
              </button>
            </span>
          )}
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, fontSize: 11, opacity: 0.85, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }} title="The bar on each node shows how full it is right now. The number on the left is concurrent requests; the number on the right is sustained throughput at full capacity.">
              <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 8, opacity: 0.7, lineHeight: 1 }}>3/8 busy</span>
                <span style={{ width: 32, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" }}>
                  <span style={{ display: "block", width: "60%", height: "100%", background: "#22c55e" }} />
                </span>
              </span>
              <span style={{ opacity: 0.85 }}>node fullness</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#60a5fa", boxShadow: "0 0 4px #60a5fa" }} />
              request out
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#34d399", boxShadow: "0 0 4px #34d399" }} />
              response back
            </span>
          </span>
        </div>
      )}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <ComponentPalette allowed={level.allowedComponents} onAdd={handleAdd} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <DiagramCanvas
            diagram={diagram}
            onChange={setDiagram}
            onDropComponent={handleDropComponent}
            runtimeByNodeId={sim.frame?.perNode}
            transitions={sim.frame?.transitions}
            onSelectionChange={(sel) => {
              setSelectedNodeId(sel.nodeId);
              setSelectedEdgeId(sel.edgeId);
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 260 }}>
          <NodeInspector
            diagram={diagram}
            selectedNodeId={selectedNodeId}
            runtime={selectedNodeId ? sim.frame?.perNode[selectedNodeId] : undefined}
            onChange={setDiagram}
          />
          <EdgeInspector diagram={diagram} selectedEdgeId={selectedEdgeId} onChange={setDiagram} />
          <SimulationResults
            report={report}
            nodeLabels={nodeLabels}
            liveFrame={sim.frame}
            totalTicks={level.simulation.workload.ticks}
          />
        </div>
      </div>
    </div>
  );
}

const simBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "8px 12px",
  borderBottom: "1px solid #1f2937",
  background: "#0f172a",
  color: "#e5e7eb",
};

const pillBtn: React.CSSProperties = {
  background: "#1f2937",
  color: "#e5e7eb",
  border: "1px solid #334155",
  borderRadius: 999,
  padding: "4px 12px",
  fontSize: 12,
  cursor: "pointer",
};
