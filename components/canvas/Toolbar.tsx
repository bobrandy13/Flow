"use client";

interface ToolbarProps {
  onValidate: () => void;
  onReset: () => void;
  onRunSimulation: () => void;
  isSimulating?: boolean;
}

export function Toolbar({ onValidate, onReset, onRunSimulation, isSimulating }: ToolbarProps) {
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
        disabled={isSimulating}
        style={btnStyle("#60a5fa", isSimulating)}
      >
        {isSimulating ? "Simulating…" : "Run Simulation"}
      </button>
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
