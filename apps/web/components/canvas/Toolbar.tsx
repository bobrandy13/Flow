"use client";

interface ToolbarProps {
  onValidate: () => void;
  onReset: () => void;
  onRunSimulation: () => void;
  isSimulating?: boolean;
  /** When true, the Run button is disabled (e.g. diagram has no client). */
  runDisabled?: boolean;
  /** Tooltip + aria-label explaining why Run is disabled. */
  runDisabledReason?: string;
}

export function Toolbar({
  onValidate,
  onReset,
  onRunSimulation,
  isSimulating,
  runDisabled,
  runDisabledReason,
}: ToolbarProps) {
  const runIsDisabled = isSimulating || runDisabled;
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "8px 12px",
        borderBottom: "1px solid #1f2937",
        background: "#0b1020",
      }}
    >
      <button type="button" onClick={onValidate} style={btnStyle("#34d399")}>Validate</button>
      <button
        type="button"
        onClick={onRunSimulation}
        disabled={runIsDisabled}
        title={runDisabled ? runDisabledReason : undefined}
        aria-label={runDisabled ? runDisabledReason : "Run Simulation"}
        style={btnStyle("#60a5fa", runIsDisabled)}
      >
        {isSimulating ? "Simulating…" : "Run Simulation"}
      </button>
      {runDisabled && runDisabledReason && (
        <span style={{ alignSelf: "center", fontSize: 12, opacity: 0.7, color: "#fcd34d" }}>
          {runDisabledReason}
        </span>
      )}
      <div style={{ flex: 1 }} />
      <button type="button" onClick={onReset} style={btnStyle("#f87171")}>Reset</button>
    </div>
  );
}

function btnStyle(color: string, disabled = false): React.CSSProperties {
  return {
    padding: "6px 14px",
    borderRadius: 8,
    border: "none",
    background: color,
    color: "#0b1020",
    fontWeight: 600,
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
}
