"use client";

import { COMPONENT_SPECS } from "@/lib/engine/component-specs";
import type { ComponentKind } from "@/types/components";
import { PALETTE_DRAG_MIME } from "./DiagramCanvas";
import { ComponentInfoCard } from "./ComponentInfoCard";

interface ComponentPaletteProps {
  allowed: ComponentKind[];
  /** Click-to-add (keyboard / a11y fallback). */
  onAdd: (kind: ComponentKind) => void;
}

export function ComponentPalette({ allowed, onAdd }: ComponentPaletteProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 12,
        borderRight: "1px solid #1f2937",
        background: "#0b1020",
        color: "#e5e7eb",
        minWidth: 200,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, letterSpacing: 1 }}>PALETTE</div>
      <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4 }}>
        Drag onto canvas, or click to add. Hover any item for details.
      </div>
      {allowed.map((kind) => {
        const spec = COMPONENT_SPECS[kind];
        return (
          <div
            key={kind}
            className="flow-tooltip"
            tabIndex={-1}
            style={{ position: "relative" }}
          >
            <button
              type="button"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData(PALETTE_DRAG_MIME, kind);
                event.dataTransfer.setData("text/plain", spec.label);
                event.dataTransfer.effectAllowed = "move";
              }}
              onClick={() => onAdd(kind)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #1f2937",
                background: "#111827",
                color: "#e5e7eb",
                cursor: "grab",
                fontSize: 13,
                textAlign: "left",
                userSelect: "none",
              }}
            >
              <span style={{ fontSize: 18 }}>{spec.emoji}</span>
              <span>{spec.label}</span>
            </button>
            <span
              role="tooltip"
              className="flow-tooltip__bubble"
              style={{ left: "calc(100% + 8px)", bottom: "auto", top: 0 }}
            >
              <ComponentInfoCard kind={kind} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
