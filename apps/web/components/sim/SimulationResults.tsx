"use client";

import type { Diagnosis, RuleResult, TickFrame, ValidationReport } from "@flow/shared/types/validation";
import { ticksToMs, formatSuccessRate, METRIC_EXPLAINERS } from "@flow/shared/engine/units";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { fontFamily, color } from "@/lib/ui/theme";

interface SimulationResultsProps {
  report: ValidationReport | null;
  /** Map of nodeId → human label, used to render the bottleneck nicely. */
  nodeLabels?: Record<string, string>;
  /** Latest streaming frame; takes precedence while a live run is in progress. */
  liveFrame?: TickFrame | null;
  /** Total ticks (used to render a progress bar during live runs). */
  totalTicks?: number;
}

export function SimulationResults({ report, nodeLabels, liveFrame, totalTicks }: SimulationResultsProps) {
  if (!report && !liveFrame) {
    return (
      <div style={{ ...panelStyle, opacity: 0.6, fontSize: 12 }}>
        Press Validate or Run Simulation to see results.
      </div>
    );
  }

  // Decide which metrics block to show: live frame (if present and no final
  // outcome yet) wins, otherwise the final report.
  const liveOnly = liveFrame && !report?.simulation;
  const liveMetrics = liveFrame?.metricsSoFar;
  const liveBottleneck = liveOnly && liveMetrics?.bottleneckNodeId;

  return (
    <div style={panelStyle}>
      {report && (
        <>
          <div style={{ fontFamily: fontFamily.display, fontSize: 13, fontWeight: 700, marginBottom: 8, letterSpacing: 1.5, textTransform: "uppercase", color: color.accent, paddingBottom: 4, borderBottom: `1px dashed ${color.border}` }}>▸ VALIDATION</div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
            {report.ruleResults.map((r, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: 12,
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: r.passed ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                  color: r.passed ? "#34d399" : "#f87171",
                  display: "flex",
                  gap: 6,
                }}
              >
                <span>{r.passed ? "✓" : "✕"}</span>
                <span>{r.message}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {liveOnly && liveMetrics && (
        <>
          <div style={{ fontSize: 14, fontWeight: 700, margin: "12px 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
            Simulation
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.5,
              padding: "2px 6px",
              borderRadius: 999,
              background: "rgba(96,165,250,0.18)",
              color: "#60a5fa",
            }}>
              LIVE · tick {liveFrame!.tick}{totalTicks ? ` / ${totalTicks}` : ""}
            </span>
          </div>
          {totalTicks && (
            <div style={{ height: 4, background: "#1f2937", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
              <div
                style={{
                  width: `${Math.min(100, (liveFrame!.tick / totalTicks) * 100)}%`,
                  height: "100%",
                  background: liveFrame!.phase === "drain" ? "#a78bfa" : "#60a5fa",
                  transition: "width 80ms linear",
                }}
              />
            </div>
          )}
          <Metric k="Phase" v={liveFrame!.phase} accent={liveFrame!.phase === "drain" ? "#a78bfa" : "#60a5fa"} />
          <Metric k="Avg latency"
            v={`${ticksToMs(liveMetrics.avgLatency).toFixed(0)} ms`}
            tip={`${METRIC_EXPLAINERS.avgLatency} (≈ ${liveMetrics.avgLatency} ticks.)`}
          />
          <Metric k="Success rate"
            v={formatSuccessRate(liveMetrics.successRate)}
            tip={METRIC_EXPLAINERS.successRate}
          />
          <Metric k="Drops" v={String(liveMetrics.drops)} tip={METRIC_EXPLAINERS.drops} />
          {liveBottleneck && (
            <Metric k="Bottleneck"
              v={nodeLabels?.[liveMetrics.bottleneckNodeId!] ?? liveMetrics.bottleneckNodeId!}
              tip={METRIC_EXPLAINERS.bottleneck}
            />
          )}
        </>
      )}

      {report?.simulation && (
        <>
          <div style={{ fontFamily: fontFamily.display, fontSize: 13, fontWeight: 700, margin: "14px 0 8px", letterSpacing: 1.5, textTransform: "uppercase", color: color.accent, paddingBottom: 4, borderBottom: `1px dashed ${color.border}` }}>▸ SIMULATION</div>
          <PassFailStamp passed={report.structuralPassed && report.simulation.passed} />
          {!report.structuralPassed ? (
            <StructuralVerdict ruleResults={report.ruleResults} simPassed={report.simulation.passed} />
          ) : (
            <MentorVerdict diagnosis={report.simulation.diagnosis} nodeLabels={nodeLabels} />
          )}
          <Metric
            k="Avg latency"
            v={`${ticksToMs(report.simulation.metrics.avgLatency).toFixed(0)} ms`}
            tip={`${METRIC_EXPLAINERS.avgLatency} (≈ ${report.simulation.metrics.avgLatency} ticks of simulation time.)`}
          />
          <Metric
            k="p95 latency"
            v={`${ticksToMs(report.simulation.metrics.p95Latency).toFixed(0)} ms`}
            tip={`${METRIC_EXPLAINERS.p95Latency} (≈ ${report.simulation.metrics.p95Latency} ticks.)`}
          />
          <Metric
            k="Success rate"
            v={formatSuccessRate(report.simulation.metrics.successRate)}
            tip={METRIC_EXPLAINERS.successRate}
          />
          <Metric
            k="Drops"
            v={String(report.simulation.metrics.drops)}
            tip={METRIC_EXPLAINERS.drops}
          />
          {report.simulation.metrics.bottleneckNodeId && (
            <Metric
              k="Bottleneck"
              v={
                nodeLabels?.[report.simulation.metrics.bottleneckNodeId] ??
                report.simulation.metrics.bottleneckNodeId
              }
              tip={METRIC_EXPLAINERS.bottleneck}
            />
          )}
        </>
      )}
    </div>
  );
}

function Metric({ k, v, accent, tip }: { k: string; v: string; accent?: string; tip?: string }) {
  const label = tip ? (
    <InfoTooltip tip={tip}>
      <span style={{ opacity: 0.6 }}>{k}</span>
    </InfoTooltip>
  ) : (
    <span style={{ opacity: 0.6 }}>{k}</span>
  );
  return (
    <div style={{ fontSize: 12, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
      {label}
      <span style={{ fontWeight: 600, color: accent ?? "#f5efd6", fontFamily: "var(--font-mono), ui-monospace, monospace" }}>{v}</span>
    </div>
  );
}

/**
 * Approval-stamp banner for the simulation verdict. Mimics a rubber stamp:
 * tilted ≈3°, double-bordered, uppercase tracked text. Lime for APPROVED,
 * red for REJECTED.
 */
function PassFailStamp({ passed }: { passed: boolean }) {
  const fg = passed ? "#9be36b" : "#ff5c5c";
  return (
    <div
      role="status"
      aria-label={passed ? "Simulation approved" : "Simulation rejected"}
      style={{
        display: "flex",
        justifyContent: "center",
        margin: "10px 0 8px",
      }}
    >
      <div
        style={{
          transform: "rotate(-3deg)",
          border: `2px solid ${fg}`,
          outline: `1px solid ${fg}`,
          outlineOffset: 3,
          padding: "6px 14px",
          color: fg,
          fontFamily: "var(--font-display), Oswald, sans-serif",
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          fontSize: 13,
          background: passed ? "rgba(155, 227, 107, 0.08)" : "rgba(255, 92, 92, 0.08)",
        }}
      >
        {passed ? "STAMPED · APPROVED" : "STAMPED · REJECTED"}
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  padding: 12,
  background: "#0e1a2b",
  color: "#f5efd6",
  borderTop: "1px solid #22405f",
  minWidth: 240,
};

/**
 * Verdict shown when the diagram fails structural rules. Even if the
 * simulator happens to meet SLA (e.g. a 2-node toy that ignores the
 * "needs a database" rule), the level is *not* complete — surface the
 * missing-pieces explanation here instead of the SLA mentor verdict.
 */
function StructuralVerdict({
  ruleResults,
  simPassed,
}: {
  ruleResults: RuleResult[];
  simPassed: boolean;
}) {
  const failed = ruleResults.filter((r) => !r.passed);
  if (failed.length === 0) return null;
  const tone = { bar: "#f87171", bg: "rgba(248,113,113,0.08)" };
  return (
    <div
      data-testid="structural-verdict"
      style={{
        marginTop: 8,
        padding: "10px 12px",
        borderLeft: `3px solid ${tone.bar}`,
        background: tone.bg,
        borderRadius: 4,
      }}
    >
      <div style={{ fontFamily: fontFamily.display, fontSize: 13, fontWeight: 700, color: tone.bar, marginBottom: 6 }}>
        Your design is missing required pieces
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.9, marginBottom: 8 }}>
        {simPassed
          ? "The simulation happened to meet the SLA, but the level brief requires components or connections that aren't in your diagram yet. Fix these and re-run."
          : "Before tuning the simulation, the level brief requires components or connections that aren't in your diagram yet."}
      </div>
      <div style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", opacity: 0.55, marginBottom: 3 }}>
        Missing
      </div>
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.5 }}>
        {failed.map((r, i) => (
          <li key={i}>{r.message}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Mentor verdict panel: turns the structured Diagnosis from the engine into
 * a readable explanation with evidence and next-step suggestions. Coloured
 * tone reflects the category — red on fail, amber on a thin-margin pass,
 * soft blue on a clean pass.
 */
function MentorVerdict({
  diagnosis,
  nodeLabels,
}: {
  diagnosis: Diagnosis | undefined;
  nodeLabels?: Record<string, string>;
}) {
  if (!diagnosis) return null;
  const tone = toneFor(diagnosis.category);
  const culpritLabels = diagnosis.culpritNodeIds
    .map((id) => nodeLabels?.[id] ?? id)
    .filter(Boolean);
  return (
    <div
      data-testid="mentor-verdict"
      style={{
        marginTop: 8,
        padding: "10px 12px",
        borderLeft: `3px solid ${tone.bar}`,
        background: tone.bg,
        borderRadius: 4,
      }}
    >
      <div
        style={{
          fontFamily: fontFamily.display,
          fontSize: 13,
          fontWeight: 700,
          color: tone.bar,
          marginBottom: 6,
        }}
      >
        {diagnosis.headline}
      </div>
      {diagnosis.explanation && (
        <div style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.9, marginBottom: 8 }}>
          {diagnosis.explanation}
        </div>
      )}
      {culpritLabels.length > 0 && (
        <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 6 }}>
          <span style={{ opacity: 0.7 }}>Culprit{culpritLabels.length > 1 ? "s" : ""}: </span>
          <span style={{ fontWeight: 600 }}>{culpritLabels.join(", ")}</span>
        </div>
      )}
      {diagnosis.evidence.length > 0 && (
        <div style={{ marginTop: 4, marginBottom: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", opacity: 0.55, marginBottom: 3 }}>
            Evidence
          </div>
          {diagnosis.evidence.map((e, i) => (
            <div
              key={i}
              style={{
                fontSize: 11,
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                padding: "1px 0",
              }}
            >
              <span style={{ opacity: 0.7 }}>{e.label}</span>
              <span style={{ fontFamily: "var(--font-mono), ui-monospace, monospace", fontWeight: 600 }}>
                {e.value}
              </span>
            </div>
          ))}
        </div>
      )}
      {diagnosis.suggestions.length > 0 && (
        <div>
          <div style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", opacity: 0.55, marginBottom: 3 }}>
            Try next
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.5 }}>
            {diagnosis.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Map a category to a coloured tone. Fail-y = red, pass-thin = amber,
 *  clean pass = soft blue. */
function toneFor(category: Diagnosis["category"]): { bar: string; bg: string } {
  switch (category) {
    case "passed_clean":
      return { bar: "#60a5fa", bg: "rgba(96,165,250,0.08)" };
    case "headroom_thin":
      return { bar: "#fbbf24", bg: "rgba(251,191,36,0.08)" };
    default:
      return { bar: "#f87171", bg: "rgba(248,113,113,0.08)" };
  }
}
