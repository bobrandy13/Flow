"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useGlossaryPanel } from "@/lib/glossary/usePanelStore";
import { GLOSSARY, GlossaryCategory, GlossaryEntry } from "@/lib/glossary/terms";
import { color, fontSize, radius, space } from "@/lib/ui/theme";

type Tab = "all" | GlossaryCategory;

const CATEGORY_ORDER: GlossaryCategory[] = ["component", "concept", "pattern"];

const TAB_LABELS: Record<Tab, string> = {
  all: "All",
  component: "Components",
  concept: "Concepts",
  pattern: "Patterns",
};

const TABS: Tab[] = ["all", "component", "concept", "pattern"];

function matchesSearch(entry: GlossaryEntry, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    entry.term.toLowerCase().includes(q) ||
    entry.eli5.toLowerCase().includes(q) ||
    entry.definition.toLowerCase().includes(q)
  );
}

// ─── EntryRow ────────────────────────────────────────────────────────────────

interface EntryRowProps {
  termKey: string;
  entry: GlossaryEntry;
  isExpanded: boolean;
  isActive: boolean;
  onToggle: (key: string) => void;
  rowRef: (el: HTMLDivElement | null) => void;
}

function EntryRow({ termKey, entry, isExpanded, isActive, onToggle, rowRef }: EntryRowProps) {
  return (
    <div
      ref={rowRef}
      style={{
        borderLeft: isActive ? `3px solid ${color.accent}` : "3px solid transparent",
        paddingLeft: space.sm,
        marginBottom: space.xs,
        cursor: "pointer",
      }}
      onClick={() => onToggle(termKey)}
    >
      {/* Collapsed header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: space.sm }}>
        <span
          style={{
            fontWeight: 600,
            color: color.accent,
            fontSize: fontSize.md,
          }}
        >
          {entry.term}
        </span>
        <span
          style={{
            color: color.textSubtle,
            fontSize: fontSize.sm,
            flexShrink: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: isExpanded ? "normal" : "nowrap",
          }}
        >
          {entry.eli5}
        </span>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div
          style={{ paddingTop: space.sm, paddingBottom: space.xs }}
          onClick={(e) => e.stopPropagation()}
        >
          <p style={{ margin: `0 0 ${space.sm}px`, color: color.text, fontSize: fontSize.base, lineHeight: 1.55 }}>
            {entry.definition}
          </p>

          {entry.relevance && (
            <p style={{ margin: `0 0 ${space.sm}px`, color: color.textMuted, fontSize: fontSize.sm, fontStyle: "italic" }}>
              {entry.relevance}
            </p>
          )}

          {entry.analogy && (
            <div
              style={{
                margin: `0 0 ${space.sm}px`,
                padding: `${space.xs}px ${space.sm}px`,
                background: "rgba(255,181,71,0.08)",
                borderLeft: `2px solid ${color.highlight}`,
                borderRadius: radius.sm,
                color: color.textMuted,
                fontSize: fontSize.sm,
              }}
            >
              💡 {entry.analogy}
            </div>
          )}

          {entry.whenToUse.length > 0 && (
            <div style={{ marginBottom: space.sm }}>
              <p style={{ margin: `0 0 ${space.xs}px`, color: color.textSubtle, fontSize: fontSize.xs, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                When to use
              </p>
              <ul style={{ margin: 0, paddingLeft: space.lg, color: color.textMuted, fontSize: fontSize.sm, lineHeight: 1.55 }}>
                {entry.whenToUse.map((bullet, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>{bullet}</li>
                ))}
              </ul>
            </div>
          )}

          {entry.diagramSvg && (
            <div
              dangerouslySetInnerHTML={{ __html: entry.diagramSvg }}
              style={{ overflow: "hidden", borderRadius: 4, marginTop: 6 }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// GlossaryPanel

export function GlossaryPanel() {
  const { isOpen, activeTerm, close } = useGlossaryPanel();

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleEntry = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // When activeTerm changes: expand it and scroll into view.
  useEffect(() => {
    if (!activeTerm || !isOpen) return;
    const id = setTimeout(() => {
      setExpandedKeys((prev) => {
        if (prev.has(activeTerm)) return prev;
        return new Set([...prev, activeTerm]);
      });
      const el = rowRefs.current[activeTerm];
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 60);
    return () => clearTimeout(id);
  }, [activeTerm, isOpen]);

  const allEntries = Object.entries(GLOSSARY);

  const filteredByTab = activeTab === "all"
    ? allEntries
    : allEntries.filter(([, e]) => e.category === activeTab);

  const filteredEntries = filteredByTab.filter(([, e]) => matchesSearch(e, searchText));

  const grouped = CATEGORY_ORDER.reduce<Record<GlossaryCategory, [string, GlossaryEntry][]>>(
    (acc, cat) => {
      acc[cat] = filteredEntries
        .filter(([, e]) => e.category === cat)
        .sort(([, a], [, b]) => a.term.localeCompare(b.term));
      return acc;
    },
    { component: [], concept: [], pattern: [] }
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 299,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 420,
          maxWidth: "100vw",
          height: "100vh",
          zIndex: 300,
          background: "#0a1628",
          borderLeft: `1px solid ${color.border}`,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: `${space.lg}px ${space.xl}px ${space.md}px`,
            borderBottom: `1px solid ${color.border}`,
            flexShrink: 0,
          }}
        >
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: space.md }}>
            <span style={{ fontWeight: 700, color: color.text, fontSize: fontSize.lg }}>
              📖 Glossary
            </span>
            <button
              onClick={close}
              aria-label="Close glossary"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: color.textSubtle,
                fontSize: 20,
                lineHeight: 1,
                padding: `${space.xs}px ${space.sm}px`,
                borderRadius: radius.sm,
              }}
            >
              ×
            </button>
          </div>

          {/* Search */}
          <input
            type="search"
            placeholder="Search terms…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: `${space.sm}px ${space.md}px`,
              background: color.bgRaised,
              border: `1px solid ${color.border}`,
              borderRadius: radius.sm,
              color: color.text,
              fontSize: fontSize.base,
              outline: "none",
              marginBottom: space.md,
            }}
          />

          {/* Category tabs */}
          <div style={{ display: "flex", gap: space.xs }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: `${space.xs}px ${space.sm}px`,
                  borderRadius: radius.sm,
                  fontSize: fontSize.sm,
                  fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab ? color.accent : color.textSubtle,
                  borderBottom: activeTab === tab ? `2px solid ${color.accent}` : "2px solid transparent",
                }}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: `${space.lg}px ${space.xl}px` }}>
          {CATEGORY_ORDER.map((cat) => {
            const entries = grouped[cat];
            if (entries.length === 0) return null;
            return (
              <div key={cat} style={{ marginBottom: space.xl }}>
                <h3
                  style={{
                    margin: `0 0 ${space.md}px`,
                    color: color.textSubtle,
                    fontSize: fontSize.xs,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 600,
                  }}
                >
                  {TAB_LABELS[cat]}
                </h3>
                {entries.map(([key, entry]) => (
                  <EntryRow
                    key={key}
                    termKey={key}
                    entry={entry}
                    isExpanded={expandedKeys.has(key)}
                    isActive={activeTerm === key}
                    onToggle={toggleEntry}
                    rowRef={(el) => { rowRefs.current[key] = el; }}
                  />
                ))}
              </div>
            );
          })}

          {filteredEntries.length === 0 && (
            <p style={{ color: color.textSubtle, fontSize: fontSize.base, textAlign: "center", marginTop: space["2xl"] }}>
              No matching terms.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
