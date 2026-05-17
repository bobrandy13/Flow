"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { DiagramCanvas } from "@/components/canvas/DiagramCanvas";
import { ComponentPalette } from "@/components/canvas/ComponentPalette";
import { Toolbar } from "@/components/canvas/Toolbar";
import { NodeInspector } from "@/components/canvas/NodeInspector";
import { EdgeInspector } from "@/components/canvas/EdgeInspector";
import { ResizableSidePanel } from "@/components/canvas/ResizableSidePanel";
import { SimulationResults } from "@/components/sim/SimulationResults";

import { getLevel } from "@flow/shared/levels";
import { evaluateRules } from "@flow/shared/engine/validator";
import { canSimulate, diagramSimulatabilityIssue } from "@flow/shared/engine/simulatability";
import { exportDiagramJson } from "@flow/shared/engine/export-diagram";
import { buildSimulationLogs } from "@flow/shared/engine/simulation-logs";
import { useSimulation } from "@/lib/hooks/useSimulation";
import { useDiagramEditor } from "@/lib/hooks/useDiagramEditor";
import { recordAttempt, recordCompletion } from "@/lib/storage/progress";
import { COMPONENT_SPECS } from "@flow/shared/engine/component-specs";
import { ticksToMs, formatSuccessRate } from "@flow/shared/engine/units";

import type { ComponentKind } from "@flow/shared/types/components";
import type { ValidationReport } from "@flow/shared/types/validation";
import { color, fontFamily } from "@/lib/ui/theme";

export default function PlayPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const level = getLevel(params.id);

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
  } = useDiagramEditor({ maxOf: level?.maxOf });

  const [baseReport, setBaseReport] = useState<ValidationReport | null>(null);

  // Build the SimulationInput (or null when prerequisites aren't met). We
  // intentionally key the input by the diagram + level identity, NOT by
  // structural validity: the player should always be able to press Play and
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
    // Always try to run the simulation: the player should be able to
    // experiment with broken or incomplete designs and watch what happens
    // (e.g. drop a queue from "Smooth the Burst" and see the server melt).
    // Completion is gated on rules + sim passing in the effect below.
    if (canSimulate(diagram)) {
      sim.reset();
      // Defer to next microtask so reset state is committed before play().
      Promise.resolve().then(() => sim.play());
    } else {
      // Truly nothing to simulate: record the attempt so the level shows
      // up as "tried" but skip the network round-trip.
      recordAttempt(level.id, diagram);
    }
  }, [diagram, level, sim]);

  // When the streaming run finishes, persist progress. Completion requires
  // BOTH the structural rules and the simulation SLA to pass. Sandbox runs
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
    resetDiagram();
    setBaseReport(null);
    sim.reset();
  }, [resetDiagram, sim]);

  const [toast, setToast] = useState<string | null>(null);
  const flashToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 1800);
  }, []);

  const copyToClipboard = useCallback(
    async (text: string, successMsg: string) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        flashToast(successMsg);
      } catch {
        flashToast("Copy failed: check clipboard permissions");
      }
    },
    [flashToast],
  );

  const handleExport = useCallback(() => {
    void copyToClipboard(exportDiagramJson(diagram), "Diagram copied to clipboard");
  }, [diagram, copyToClipboard]);

  const handleCopyLogs = useCallback(() => {
    if (!level || !sim.outcome) return;
    const text = buildSimulationLogs({
      levelId: level.id,
      levelTitle: level.title,
      diagram,
      outcome: sim.outcome,
      frames: sim.frames ?? undefined,
      finalPerNode: sim.frame?.perNode,
      sla: {
        minSuccessRate: level.simulation.sla.minSuccessRate,
        p95LatencyMaxTicks: level.simulation.sla.maxP95Latency,
      },
    });
    void copyToClipboard(text, "Logs copied to clipboard");
  }, [level, sim.outcome, sim.frames, sim.frame, diagram, copyToClipboard]);

  const componentCounts = useMemo(() => {
    const counts: Partial<Record<ComponentKind, number>> = {};
    for (const n of diagram.nodes) {
      counts[n.kind] = (counts[n.kind] ?? 0) + 1;
    }
    return counts;
  }, [diagram.nodes]);

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
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${color.borderStrong}`, background: "rgba(14, 26, 43, 0.92)", color: color.text }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: fontFamily.mono, fontSize: 10, color: color.accent, letterSpacing: 2 }}>SHEET · {level.id.toUpperCase()}</div>
            <h1 style={{ margin: "2px 0 4px", fontFamily: fontFamily.display, fontSize: 22, letterSpacing: 1.5, textTransform: "uppercase", color: color.text }}>{level.title}</h1>
            <p style={{ margin: 0, fontSize: 13, color: color.textMuted, maxWidth: 720, lineHeight: 1.5 }}>{level.brief}</p>
            <div style={{ marginTop: 8, fontFamily: fontFamily.mono, fontSize: 11, color: color.textMuted, letterSpacing: 0.5 }}>
              SLA · success ≥ <strong style={{ color: color.accent }}>{formatSuccessRate(sla.minSuccessRate)}</strong>
              {"  ·  "}p95 ≤ <strong style={{ color: color.accent }}>{ticksToMs(sla.maxP95Latency)} ms</strong>
              {"  ·  "}load <strong style={{ color: color.accent }}>~{reqPerSec.toFixed(0)} req/s</strong>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            {level.lesson && (
              <Link
                href={`/levels/${level.id}/lesson`}
                style={{
                  fontFamily: fontFamily.display,
                  fontSize: 11,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  color: color.highlight,
                  textDecoration: "none",
                  padding: "4px 10px",
                  border: `1px solid ${color.highlightSoftBorder}`,
                  background: color.highlightSoftBg,
                }}
                title="Re-read the concept lesson for this level"
              >
                📖 CONCEPT
              </Link>
            )}
            <Link href="/levels" style={{ fontFamily: fontFamily.mono, fontSize: 11, color: color.accent, letterSpacing: 1, textDecoration: "none" }}>← All Levels</Link>
          </div>
        </div>
      </div>
    );
  }, [level]);

  const simulatabilityIssue = useMemo(() => diagramSimulatabilityIssue(diagram), [diagram]);
  const isSandboxMode = baseReport !== null && !baseReport.structuralPassed;

  if (!level) {
    return (
      <div style={{ padding: 32, color: color.text, background: color.paper, minHeight: "100vh" }}>
        <p>Level not found.</p>
        <button onClick={() => router.push("/levels")} style={{ marginTop: 12 }}>Back to levels</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 37px)", background: color.paper }}>
      {briefBlock}
      <Toolbar
        onValidate={handleValidate}
        onReset={handleReset}
        onRunSimulation={handleRunSimulation}
        onExport={handleExport}
        toast={toast ?? undefined}
        isSimulating={sim.isRunning}
        runDisabled={!canSimulate(diagram)}
        runDisabledReason={simulatabilityIssue ?? undefined}
      />
      {isSandboxMode && (sim.frame || sim.outcome) && (
        <div
          role="status"
          style={{
            background: color.highlightSoftBg,
            borderBottom: `1px solid ${color.highlightSoftBorder}`,
            color: color.highlight,
            padding: "10px 16px",
            fontSize: 12,
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: fontFamily.display,
              fontSize: 11,
              letterSpacing: 2,
              padding: "2px 8px",
              border: `1px solid ${color.highlight}`,
              color: color.highlight,
              alignSelf: "flex-start",
              textTransform: "uppercase",
            }}
          >
            ⚑ REVISIONS REQUIRED
          </span>
          <div style={{ flex: 1, color: color.text }}>
            <div style={{ fontFamily: fontFamily.display, letterSpacing: 1, textTransform: "uppercase", color: color.highlight, marginBottom: 4 }}>
              Sandbox run: won&apos;t count toward completion.
            </div>
            <div style={{ color: color.textMuted, marginBottom: 4 }}>
              The simulation runs, but the level&apos;s rules aren&apos;t satisfied yet. Address the items below to earn the stamp:
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc", color: color.text }}>
              {baseReport!.ruleResults
                .filter((r) => !r.passed)
                .map((r, idx) => (
                  <li key={idx} style={{ lineHeight: 1.5 }}>{r.message}</li>
                ))}
            </ul>
          </div>
        </div>
      )}
      {(sim.isRunning || sim.frame || sim.loading || sim.error) && (
        <div style={simBarStyle}>
          {sim.loading ? (
            <span style={{ fontFamily: fontFamily.mono, fontSize: 12, color: color.accent, letterSpacing: 1 }}>⏳ COMPUTING SIMULATION…</span>
          ) : sim.isRunning ? (
            <button onClick={sim.pause} style={pillBtn}>⏸ PAUSE</button>
          ) : (
            <button onClick={sim.play} style={pillBtn} disabled={sim.isFinished}>▶ PLAY</button>
          )}
          <button onClick={sim.reset} style={pillBtn}>↺ RESET</button>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: fontFamily.mono, fontSize: 11, color: color.textMuted, letterSpacing: 1 }}>
            SPEED
            <input
              type="range"
              min={1}
              max={32}
              step={1}
              value={sim.speed}
              onChange={(e) => sim.setSpeed(Number(e.target.value))}
              style={{ width: 120, accentColor: color.accent }}
            />
            <span style={{ fontFamily: fontFamily.mono, fontVariantNumeric: "tabular-nums", minWidth: 64, color: color.accent }}>
              {sim.speed} t/s
            </span>
          </label>
          {sim.frame && (
            <span style={{ fontFamily: fontFamily.mono, fontSize: 11, color: color.text, letterSpacing: 0.5 }}>
              TICK <span style={{ color: color.accent }}>{sim.frame.tick.toString().padStart(4, "0")}</span> · {sim.frame.phase.toUpperCase()}
            </span>
          )}
          {sim.error && (
            <span
              role="alert"
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 11,
                color: color.danger,
                background: "rgba(255, 92, 92, 0.10)",
                border: `1px solid ${color.danger}`,
                padding: "2px 8px",
                letterSpacing: 0.5,
              }}
            >
              ⚠ {sim.error}{" "}
              <button
                onClick={() => { sim.reset(); sim.play(); }}
                style={{ ...pillBtn, padding: "2px 8px", fontSize: 11, marginLeft: 6 }}
              >
                RETRY
              </button>
            </span>
          )}
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, fontFamily: fontFamily.mono, fontSize: 10, color: color.textMuted, letterSpacing: 0.5, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }} title="Each node's bar shows how full it is right now. Number on the left = concurrent requests; right = sustained throughput at full capacity.">
              <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 8, color: color.textSubtle, lineHeight: 1 }}>3/8 BUSY</span>
                <span style={{ width: 32, height: 4, background: "rgba(122, 223, 255, 0.10)", border: `1px solid ${color.border}`, overflow: "hidden" }}>
                  <span style={{ display: "block", width: "60%", height: "100%", background: color.success }} />
                </span>
              </span>
              <span>NODE FULLNESS</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: color.accent, boxShadow: `0 0 4px ${color.accent}` }} />
              REQUEST OUT
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: color.success, boxShadow: `0 0 4px ${color.success}` }} />
              RESPONSE BACK
            </span>
          </span>
        </div>
      )}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <ComponentPalette
          allowed={level.allowedComponents}
          onAdd={handleAdd}
          counts={componentCounts}
          maxOf={level.maxOf}
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
              maxOf={level.maxOf}
              onChange={handleDiagramChange}
            />
            <EdgeInspector diagram={diagram} selectedEdgeId={selectedEdgeId} onChange={handleDiagramChange} />
            <SimulationResults
              report={report}
              nodeLabels={nodeLabels}
              liveFrame={sim.frame}
              totalTicks={level.simulation.workload.ticks}
            />
            {sim.outcome && (
              <button
                type="button"
                onClick={handleCopyLogs}
                title="Copy a plain-text diagnostic dump of this simulation run (per-node served/dropped, drop events by tick, your diagram)."
                style={{
                  margin: "8px 12px 12px",
                  padding: "10px 12px",
                  border: `1px solid ${color.borderStrong}`,
                  background: "rgba(19, 36, 58, 0.7)",
                  color: color.text,
                  fontFamily: fontFamily.display,
                  fontSize: 12,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  width: "calc(100% - 24px)",
                  textAlign: "left",
                }}
              >
                📋 COPY SIMULATION LOGS
                <span style={{ display: "block", fontFamily: fontFamily.mono, fontWeight: 400, fontSize: 10, color: color.textMuted, marginTop: 4, letterSpacing: 0.5, textTransform: "none" }}>
                  Per-node served/dropped, drop events by tick, and your diagram.
                </span>
              </button>
            )}
          </div>
        </ResizableSidePanel>
      </div>
    </div>
  );
}

const simBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "8px 14px",
  borderBottom: `1px solid ${color.borderStrong}`,
  background: "rgba(19, 36, 58, 0.85)",
  color: color.text,
};

const pillBtn: React.CSSProperties = {
  background: color.accent,
  color: color.accentInk,
  border: `1px solid ${color.accent}`,
  padding: "4px 12px",
  fontFamily: fontFamily.display,
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  cursor: "pointer",
};
