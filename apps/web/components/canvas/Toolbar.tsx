"use client";

import { color, fontFamily } from "@/lib/ui/theme";

interface ToolbarProps {
  onValidate: () => void;
  onReset: () => void;
  onRunSimulation: () => void;
  onExport?: () => void;
  /** Brief flash message shown on the right of the toolbar (e.g. "Copied!"). */
  toast?: string;
  isSimulating?: boolean;
  /** When true, the Run button is disabled (e.g. diagram has no client). */
  runDisabled?: boolean;
  /** Tooltip + aria-label explaining why Run is disabled. */
  runDisabledReason?: string;
}

/**
 * Instrument-panel style toolbar: flat, uppercase, drop-shadowed buttons.
 * Each button uses a coloured top stripe + flat inset shadow to feel like
 * an industrial pushbutton.
 */
export function Toolbar({
  onValidate,
  onReset,
  onRunSimulation,
  onExport,
  toast,
  isSimulating,
  runDisabled,
  runDisabledReason,
}: ToolbarProps) {
  const runIsDisabled = Boolean(isSimulating || runDisabled);
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "8px 12px",
        borderBottom: `1px solid ${color.borderStrong}`,
        background: "rgba(14, 26, 43, 0.92)",
        alignItems: "center",
      }}
    >
      <ToolButton onClick={onValidate} tone={color.success}>VALIDATE</ToolButton>
      <ToolButton
        onClick={onRunSimulation}
        tone={color.accent}
        disabled={runIsDisabled}
        title={runDisabled ? runDisabledReason : undefined}
        ariaLabel={runDisabled ? runDisabledReason : "Run Simulation"}
      >
        {isSimulating ? "SIMULATING…" : "RUN SIMULATION"}
      </ToolButton>
      {onExport && (
        <ToolButton
          onClick={onExport}
          tone={color.highlight}
          title="Copy this diagram to clipboard as JSON (no coordinates)"
        >
          📋 EXPORT
        </ToolButton>
      )}
      {runDisabled && runDisabledReason && (
        <span
          style={{
            alignSelf: "center",
            fontFamily: fontFamily.mono,
            fontSize: 11,
            color: color.warning,
            letterSpacing: 0.5,
          }}
        >
          ⚠ {runDisabledReason}
        </span>
      )}
      <div style={{ flex: 1 }} />
      {toast && (
        <span
          role="status"
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 11,
            color: color.success,
            background: "rgba(155, 227, 107, 0.10)",
            border: `1px solid ${color.success}`,
            padding: "3px 10px",
            letterSpacing: 0.5,
          }}
        >
          ✓ {toast}
        </span>
      )}
      <ToolButton onClick={onReset} tone={color.danger}>RESET</ToolButton>
    </div>
  );
}

function ToolButton({
  children,
  onClick,
  tone,
  disabled,
  title,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone: string;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={Boolean(disabled)}
      title={title}
      aria-label={ariaLabel}
      style={{
        position: "relative",
        padding: "6px 14px",
        border: `1px solid ${tone}`,
        background: tone,
        color: color.accentInk,
        fontFamily: fontFamily.display,
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        boxShadow: `2px 2px 0 0 rgba(14, 26, 43, 0.7)`,
      }}
    >
      {children}
    </button>
  );
}
