"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import type { GlossaryEntry } from "@/lib/glossary/terms";
import { color, fontFamily } from "@/lib/ui/theme";

interface Props {
  entry: GlossaryEntry;
  matchedText: string;
}

export function GlossaryTerm({ entry, matchedText }: Props) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<"above" | "below">("above");
  const spanRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Determine if tooltip should render above or below
    if (spanRef.current) {
      const rect = spanRef.current.getBoundingClientRect();
      setPosition(rect.top < 200 ? "below" : "above");
    }
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(false), 150);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return (
    <span
      ref={spanRef}
      className="glossary-term"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={show}
      tabIndex={0}
      role="button"
      aria-label={`Definition of ${entry.term}`}
    >
      {matchedText}
      {visible && (
        <span
          style={{
            ...tooltipStyle,
            ...(position === "below" ? tooltipBelow : tooltipAbove),
          }}
          onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
          onMouseLeave={hide}
        >
          <span style={tooltipHeader}>{entry.term}</span>
          <span style={tooltipBody}>{entry.definition}</span>
          <span style={tooltipRelevance}>{entry.relevance}</span>
          {entry.analogy && (
            <span style={tooltipAnalogy}>
              <span style={analogyIcon}>💡</span>
              {entry.analogy}
            </span>
          )}
          <span style={tooltipArrow(position)} />
        </span>
      )}
    </span>
  );
}

/* ── Styles ── */

const tooltipStyle: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  transform: "translateX(-50%)",
  width: 320,
  maxWidth: "90vw",
  padding: "14px 16px",
  background: "#13243a",
  border: `1px solid ${color.borderStrong}`,
  borderRadius: 8,
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)",
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  // Animation
  animation: "glossaryFadeIn 0.15s ease-out",
};

const tooltipAbove: React.CSSProperties = {
  bottom: "calc(100% + 10px)",
};

const tooltipBelow: React.CSSProperties = {
  top: "calc(100% + 10px)",
};

const tooltipHeader: React.CSSProperties = {
  fontFamily: fontFamily.display,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: color.accent,
};

const tooltipBody: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.6,
  color: color.text,
};

const tooltipRelevance: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.55,
  color: color.textMuted,
  paddingTop: 4,
  borderTop: `1px solid ${color.border}`,
};

const tooltipAnalogy: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.5,
  color: color.textSubtle,
  fontStyle: "italic",
  display: "flex",
  gap: 6,
  alignItems: "flex-start",
};

const analogyIcon: React.CSSProperties = {
  flexShrink: 0,
  fontSize: 11,
};

function tooltipArrow(position: "above" | "below"): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    width: 0,
    height: 0,
    borderLeft: "6px solid transparent",
    borderRight: "6px solid transparent",
  };
  if (position === "above") {
    return {
      ...base,
      bottom: -6,
      borderTop: `6px solid ${color.borderStrong}`,
    };
  }
  return {
    ...base,
    top: -6,
    borderBottom: `6px solid ${color.borderStrong}`,
  };
}
