"use client";

import { useState } from "react";
import { useGlossaryPanel } from "@/lib/glossary/usePanelStore";
import { color, fontFamily } from "@/lib/ui/theme";

interface PrereqCalloutProps {
  title?: string;
  items: { term: string; eli5: string }[];
}

export function PrereqCallout({
  title = "You'll want to know first",
  items,
}: PrereqCalloutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const glossary = useGlossaryPanel();

  return (
    <div style={wrapperStyle}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        style={headerStyle}
        aria-expanded={isOpen}
      >
        <span
          style={{
            display: "inline-block",
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            fontSize: 11,
            marginRight: 8,
            color: color.highlight,
            lineHeight: 1,
          }}
        >
          ▶
        </span>
        <span style={headingTextStyle}>{title}</span>
      </button>

      {isOpen && (
        <ul style={listStyle}>
          {items.map((item, i) => (
            <li key={i} style={itemStyle}>
              <button
                type="button"
                onClick={() => glossary.open(item.term.toLowerCase())}
                style={termButtonStyle}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.textDecoration =
                    "underline";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.textDecoration =
                    "none";
                }}
              >
                {item.term}
              </button>
              <span style={eli5Style}>{item.eli5}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  margin: "0 0 16px",
  borderLeft: `3px solid ${color.highlight}`,
  background: color.highlightSoftBg,
  borderRadius: 6,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: "10px 12px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontFamily: fontFamily.body,
  textAlign: "left",
  color: color.text,
};

const headingTextStyle: React.CSSProperties = {
  fontFamily: fontFamily.mono,
  fontSize: 12,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: color.highlight,
  fontWeight: 700,
};

const listStyle: React.CSSProperties = {
  margin: 0,
  padding: "0 12px 10px 12px",
  listStyle: "none",
};

const itemStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "baseline",
  marginBottom: 6,
  fontSize: 14,
  lineHeight: 1.6,
};

const termButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  fontWeight: 700,
  fontSize: 14,
  color: color.highlight,
  cursor: "pointer",
  textDecoration: "none",
  fontFamily: fontFamily.body,
  flexShrink: 0,
};

const eli5Style: React.CSSProperties = {
  color: color.textMuted,
  fontSize: 13.5,
  lineHeight: 1.6,
};
