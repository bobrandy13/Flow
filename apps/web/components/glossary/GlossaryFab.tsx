"use client";

import { useGlossaryPanel } from "@/lib/glossary/usePanelStore";
import { GlossaryPanel } from "@/components/glossary/GlossaryPanel";
import { color, radius } from "@/lib/ui/theme";

export function GlossaryFab() {
  const { isOpen, toggle } = useGlossaryPanel();

  return (
    <>
      <button
        onClick={toggle}
        aria-label={isOpen ? "Close glossary" : "Open glossary"}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 200,
          width: 48,
          height: 48,
          borderRadius: radius.pill,
          border: `1px solid ${color.borderStrong}`,
          background: color.bgRaised,
          color: color.accent,
          fontSize: 20,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 2px 12px rgba(0,0,0,0.4)`,
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        {isOpen ? "✕" : "📖"}
      </button>
      <GlossaryPanel />
    </>
  );
}
