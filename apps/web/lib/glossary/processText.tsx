"use client";

import React from "react";
import { GLOSSARY, GLOSSARY_PATTERNS } from "./terms";
import { GlossaryTerm } from "@/components/glossary/GlossaryTerm";

/**
 * Processes a text string and returns React nodes with glossary terms wrapped
 * in interactive <GlossaryTerm> components. Only highlights the FIRST occurrence
 * of each term in a given text block to avoid visual noise.
 */
export function processGlossaryText(text: string): React.ReactNode {
  if (!text) return text;

  // Track which terms we've already highlighted in this text block
  const highlighted = new Set<string>();

  // Find all matches with their positions
  interface Match {
    key: string;
    start: number;
    end: number;
    text: string;
  }

  const matches: Match[] = [];

  for (const { key, regex } of GLOSSARY_PATTERNS) {
    if (highlighted.has(key)) continue;

    // Reset regex lastIndex
    regex.lastIndex = 0;
    const m = regex.exec(text);
    if (m) {
      matches.push({ key, start: m.index, end: m.index + m[0].length, text: m[0] });
      highlighted.add(key);
    }
  }

  if (matches.length === 0) return text;

  // Sort by position
  matches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches (keep earlier / longer ones)
  const filtered: Match[] = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }

  // Build React nodes
  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (let i = 0; i < filtered.length; i++) {
    const m = filtered[i];
    // Add text before this match
    if (m.start > cursor) {
      nodes.push(text.slice(cursor, m.start));
    }
    // Add the glossary term component
    const entry = GLOSSARY[m.key];
    nodes.push(
      <GlossaryTerm key={`g-${i}`} entry={entry} matchedText={m.text} />,
    );
    cursor = m.end;
  }

  // Add remaining text
  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return <>{nodes}</>;
}
