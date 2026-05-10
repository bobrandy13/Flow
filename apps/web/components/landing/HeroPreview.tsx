"use client";

import { useEffect, useState } from "react";
import { color } from "@/lib/ui/theme";

/**
 * Tiny inline preview: three nodes (client → server → database) with a
 * dot traveling along each edge. Pure SVG/CSS, no React Flow.
 *
 * Honors `prefers-reduced-motion`: when set, the dots stay static at
 * the midpoint of each edge instead of animating.
 */
export function HeroPreview() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    // Sync initial value once on mount. This is the canonical pattern for
    // matchMedia-backed state and is intentional, despite the lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const nodes = [
    { cx: 50, icon: "👤", label: "Client" },
    { cx: 165, icon: "🖥️", label: "Server" },
    { cx: 280, icon: "🗄️", label: "Database" },
  ];

  return (
    <svg
      viewBox="0 0 330 120"
      role="img"
      aria-label="Animated preview: client to server to database with traffic flowing between them"
      style={{
        display: "block",
        width: "100%",
        maxWidth: 420,
        height: "auto",
        margin: "0 auto",
        opacity: 0.9,
      }}
    >
      <defs>
        <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color.link} stopOpacity="0.2" />
          <stop offset="50%" stopColor={color.link} stopOpacity="0.7" />
          <stop offset="100%" stopColor={color.link} stopOpacity="0.2" />
        </linearGradient>
      </defs>

      <line x1="80" y1="60" x2="135" y2="60" stroke="url(#edgeGrad)" strokeWidth="1.5" />
      <line x1="195" y1="60" x2="250" y2="60" stroke="url(#edgeGrad)" strokeWidth="1.5" />

      <circle r="3.5" fill={color.accent} cy={60} cx={reduced ? 107 : undefined}>
        {!reduced && (
          <animate
            attributeName="cx"
            values="80;135;80"
            keyTimes="0;0.5;1"
            dur="2.4s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      <circle r="3.5" fill={color.accent} cy={60} cx={reduced ? 222 : undefined}>
        {!reduced && (
          <animate
            attributeName="cx"
            values="195;250;195"
            keyTimes="0;0.5;1"
            dur="2.4s"
            begin="0.8s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {nodes.map((n) => (
        <g key={n.label}>
          <circle
            cx={n.cx}
            cy={60}
            r="22"
            fill={color.bgRaised}
            stroke={color.borderStrong}
            strokeWidth="1"
          />
          <text x={n.cx} y={66} textAnchor="middle" fontSize="18" style={{ userSelect: "none" }}>
            {n.icon}
          </text>
          <text
            x={n.cx}
            y={100}
            textAnchor="middle"
            fontSize="9"
            fill={color.textMuted}
            style={{ userSelect: "none" }}
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
