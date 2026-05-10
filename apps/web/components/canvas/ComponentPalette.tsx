"use client";

import { COMPONENT_SPECS } from "@flow/shared/engine/component-specs";
import type { ComponentKind } from "@flow/shared/types/components";
import { PALETTE_DRAG_MIME } from "./DiagramCanvas";
import { ComponentInfoCard } from "./ComponentInfoCard";
import { color, fontFamily } from "@/lib/ui/theme";

interface ComponentPaletteProps {
  allowed: ComponentKind[];
  /** Click-to-add (keyboard / a11y fallback). */
  onAdd: (kind: ComponentKind) => void;
  /** Current count of each kind already placed on the canvas. */
  counts?: Partial<Record<ComponentKind, number>>;
  /** Optional per-kind cap from the level definition. */
  maxOf?: Partial<Record<ComponentKind, number>>;
}

type PaletteCategory = "Compute" | "Data" | "Routing" | "Reliability";

const CATEGORY_OF: Record<ComponentKind, PaletteCategory> = {
  client: "Compute",
  server: "Compute",
  cache: "Data",
  database: "Data",
  load_balancer: "Routing",
  shard: "Routing",
  queue: "Routing",
  rate_limiter: "Reliability",
  circuit_breaker: "Reliability",
  cdn: "Routing",
};

const CATEGORY_ORDER: PaletteCategory[] = ["Compute", "Routing", "Data", "Reliability"];

// Two-letter part-class prefix for the catalog (cosmetic only).
const PART_CLASS: Record<ComponentKind, string> = {
  client: "CL", server: "SV", cache: "CH", database: "DB",
  load_balancer: "LB", shard: "SH", queue: "QU",
  rate_limiter: "RL", circuit_breaker: "CB", cdn: "CD",
};

export function ComponentPalette({ allowed, onAdd, counts, maxOf }: ComponentPaletteProps) {
  const grouped = new Map<PaletteCategory, ComponentKind[]>();
  for (const kind of allowed) {
    const cat = CATEGORY_OF[kind];
    const arr = grouped.get(cat) ?? [];
    arr.push(kind);
    grouped.set(cat, arr);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: 12,
        borderRight: `1px solid ${color.borderStrong}`,
        background: "rgba(14, 26, 43, 0.92)",
        color: color.text,
        minWidth: 220,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 10,
            letterSpacing: 2,
            color: color.accent,
          }}
        >
          PARTS · CATALOG
        </div>
        <div
          style={{
            fontFamily: fontFamily.display,
            fontSize: 16,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: color.text,
            margin: "2px 0 4px",
          }}
        >
          Components
        </div>
        <div style={{ fontSize: 11, color: color.textMuted, lineHeight: 1.4 }}>
          Drag onto the sheet, or click to add. Hover any item for details.
        </div>
      </div>

      {CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((cat) => (
        <div key={cat} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 10,
              letterSpacing: 2,
              color: color.accent,
              borderBottom: `1px dashed ${color.border}`,
              paddingBottom: 3,
            }}
          >
            {cat.toUpperCase()}
          </div>
          {grouped.get(cat)!.map((kind, i) => {
            const spec = COMPONENT_SPECS[kind];
            const used = counts?.[kind] ?? 0;
            const cap = maxOf?.[kind];
            const atLimit = cap !== undefined && used >= cap;
            const partNo = `${PART_CLASS[kind]}-${(i + 1).toString().padStart(2, "0")}`;
            return (
              <div
                key={kind}
                className="flow-tooltip"
                tabIndex={-1}
                style={{ position: "relative" }}
              >
                <button
                  type="button"
                  draggable={!atLimit}
                  disabled={atLimit}
                  aria-label={
                    atLimit
                      ? `${spec.label} — limit reached (${used} of ${cap})`
                      : `Add ${spec.label}${cap !== undefined ? ` (${used} of ${cap} used)` : ""}`
                  }
                  onDragStart={(event) => {
                    if (atLimit) {
                      event.preventDefault();
                      return;
                    }
                    event.dataTransfer.setData(PALETTE_DRAG_MIME, kind);
                    event.dataTransfer.setData("text/plain", spec.label);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => {
                    if (!atLimit) onAdd(kind);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    border: `1px solid ${color.borderStrong}`,
                    background: "rgba(19, 36, 58, 0.7)",
                    color: color.text,
                    cursor: atLimit ? "not-allowed" : "grab",
                    fontFamily: fontFamily.body,
                    fontSize: 13,
                    textAlign: "left",
                    userSelect: "none",
                    opacity: atLimit ? 0.45 : 1,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{spec.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: fontFamily.display,
                        fontSize: 12,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        color: color.text,
                      }}
                    >
                      {spec.label}
                    </div>
                    <div
                      style={{
                        fontFamily: fontFamily.mono,
                        fontSize: 9,
                        color: color.textSubtle,
                        letterSpacing: 1,
                      }}
                    >
                      PART {partNo}
                    </div>
                  </div>
                  {cap !== undefined ? (
                    <span
                      title={`${used} placed of ${cap} allowed`}
                      style={{
                        fontFamily: fontFamily.mono,
                        fontSize: 10,
                        padding: "1px 6px",
                        background: atLimit ? "rgba(255, 92, 92, 0.18)" : "rgba(122, 223, 255, 0.08)",
                        color: atLimit ? color.danger : color.accent,
                        border: `1px solid ${atLimit ? color.danger : color.borderStrong}`,
                        letterSpacing: 0.5,
                      }}
                    >
                      {used}/{cap}
                    </span>
                  ) : used > 0 ? (
                    <span
                      title={`${used} placed (no limit)`}
                      style={{
                        fontFamily: fontFamily.mono,
                        fontSize: 10,
                        padding: "1px 6px",
                        background: "rgba(122, 223, 255, 0.08)",
                        color: color.textMuted,
                        border: `1px solid ${color.borderStrong}`,
                        letterSpacing: 0.5,
                      }}
                    >
                      {used}
                    </span>
                  ) : null}
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
      ))}
    </div>
  );
}
