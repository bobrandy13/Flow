"use client";

import type { TickFrame, ValidationReport } from "@flow/shared/types/validation";
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
          <PassFailStamp passed={report.simulation.passed} />
          {report.simulation.failureReason && (
            <div style={{ fontSize: 12, color: "#ff5c5c", margin: "4px 0" }}>
              {report.simulation.failureReason}
            </div>
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
