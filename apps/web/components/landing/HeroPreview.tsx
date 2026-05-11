"use client";

import { useEffect, useState } from "react";
import { color, fontFamily } from "@/lib/ui/theme";

/**
 * Inline blueprint diagram: client → server → database with traveling
 * traffic dots, drawn as a technical schematic with leader-line callouts.
 *
 * Honors `prefers-reduced-motion`: when set, the dots are static at the
 * midpoint of each edge instead of animating.
 */
export function HeroPreview() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const nodes = [
    { cx: 60, label: "CLIENT", part: "C-01" },
    { cx: 175, label: "SERVER", part: "S-01" },
    { cx: 290, label: "DATABASE", part: "D-01" },
  ];

  const ink = color.text;
  const cyan = color.accent;
  const muted = "rgba(245, 239, 214, 0.5)";

  return (
    <figure
      className="flow-panel"
      style={{
        margin: "0 auto",
        maxWidth: 460,
        position: "relative",
        padding: 8,
      }}
    >
      {/* Title block above the drawing */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: fontFamily.mono,
          fontSize: 9,
          letterSpacing: 1.5,
          color: cyan,
          padding: "2px 4px 6px",
          borderBottom: `1px dashed ${color.border}`,
          marginBottom: 4,
        }}
      >
        <span>EXERCISE 001 — REQUEST PATH</span>
        <span>SCALE 1:1</span>
      </div>

      <svg
        viewBox="0 0 350 140"
        role="img"
        aria-label="Animated preview: client to server to database with traffic flowing between them"
        style={{ display: "block", width: "100%", height: "auto" }}
      >
        {/* Edges (technical drawing dashed look on top, solid stroke beneath). */}
        <line x1="92" y1="70" x2="142" y2="70" stroke={cyan} strokeWidth="1" opacity="0.7" />
        <line x1="207" y1="70" x2="257" y2="70" stroke={cyan} strokeWidth="1" opacity="0.7" />

        {/* Travelling packets */}
        <circle r="3.5" fill={cyan} cy={70} cx={reduced ? 117 : undefined}>
          {!reduced && (
            <animate
              attributeName="cx"
              values="92;142;92"
              keyTimes="0;0.5;1"
              dur="2.4s"
              repeatCount="indefinite"
            />
          )}
        </circle>
        <circle r="3.5" fill={cyan} cy={70} cx={reduced ? 232 : undefined}>
          {!reduced && (
            <animate
              attributeName="cx"
              values="207;257;207"
              keyTimes="0;0.5;1"
              dur="2.4s"
              begin="0.8s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* Nodes */}
        {nodes.map((n) => (
          <g key={n.label}>
            {/* Outer thin ring (technical drawing accent) */}
            <circle cx={n.cx} cy={70} r="28" fill="none" stroke={cyan} strokeWidth="0.5" opacity="0.4" />
            <circle
              cx={n.cx}
              cy={70}
              r="22"
              fill={color.bgRaised}
              stroke={cyan}
              strokeWidth="1.25"
            />
            {/* Cross-hair tick marks */}
            <line x1={n.cx - 3} y1={70} x2={n.cx + 3} y2={70} stroke={cyan} strokeWidth="0.75" opacity="0.6" />
            <line x1={n.cx} y1={67} x2={n.cx} y2={73} stroke={cyan} strokeWidth="0.75" opacity="0.6" />
            {/* Leader line up to part number */}
            <line x1={n.cx} y1={48} x2={n.cx} y2={26} stroke={muted} strokeWidth="0.5" />
            <text
              x={n.cx}
              y={20}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono), ui-monospace, monospace"
              fill={cyan}
              style={{ userSelect: "none", letterSpacing: 1 }}
            >
              {n.part}
            </text>
            {/* Label below */}
            <text
              x={n.cx}
              y={114}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-display), Oswald, sans-serif"
              fill={ink}
              style={{ userSelect: "none", letterSpacing: 2 }}
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
