"use client";

import type { ReactNode } from "react";

interface InfoTooltipProps {
  children: ReactNode;
  tip: ReactNode;
  inline?: boolean;
}

/**
 * Pure-CSS hover tooltip — no portals, no library. Designed for the dark theme.
 * Shows on `:hover` and `:focus-within` so it's keyboard accessible. The
 * visibility is driven by the `flow-tooltip` class rules in app/globals.css.
 */
export function InfoTooltip({ children, tip, inline = true }: InfoTooltipProps) {
  return (
    <span
      className="flow-tooltip"
      tabIndex={0}
      style={{
        display: inline ? "inline-flex" : "flex",
        alignItems: "center",
        gap: 4,
        position: "relative",
        cursor: "help",
        outline: "none",
      }}
    >
      {children}
      <span
        aria-hidden
        style={{
          fontSize: 10,
          opacity: 0.6,
          border: "1px solid currentColor",
          borderRadius: "50%",
          width: 12,
          height: 12,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        ?
      </span>
      <span role="tooltip" className="flow-tooltip__bubble">
        {tip}
      </span>
    </span>
  );
}
