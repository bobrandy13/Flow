"use client";

import { COMPONENT_SPECS } from "@flow/shared/engine/component-specs";
import type { ComponentKind } from "@flow/shared/types/components";
import { PALETTE_DRAG_MIME } from "./DiagramCanvas";
import { ComponentInfoCard } from "./ComponentInfoCard";

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
};

const CATEGORY_ORDER: PaletteCategory[] = ["Compute", "Routing", "Data", "Reliability"];

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
        gap: 12,
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
      {CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((cat) => (
        <div key={cat} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.45, letterSpacing: 1 }}>
            {cat.toUpperCase()}
          </div>
          {grouped.get(cat)!.map((kind) => {
            const spec = COMPONENT_SPECS[kind];
            const used = counts?.[kind] ?? 0;
            const cap = maxOf?.[kind];
            const atLimit = cap !== undefined && used >= cap;
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
                    borderRadius: 8,
                    border: "1px solid #1f2937",
                    background: "#111827",
                    color: "#e5e7eb",
                    cursor: atLimit ? "not-allowed" : "grab",
                    fontSize: 13,
                    textAlign: "left",
                    userSelect: "none",
                    opacity: atLimit ? 0.45 : 1,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{spec.emoji}</span>
                  <span style={{ flex: 1 }}>{spec.label}</span>
                  {cap !== undefined ? (
                    <span
                      title={`${used} placed of ${cap} allowed`}
                      style={{
                        fontSize: 10,
                        fontVariantNumeric: "tabular-nums",
                        padding: "1px 6px",
                        borderRadius: 999,
                        background: atLimit ? "rgba(248,113,113,0.18)" : "rgba(255,255,255,0.06)",
                        color: atLimit ? "#fca5a5" : "#9ca3af",
                        border: `1px solid ${atLimit ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      {used}/{cap}
                    </span>
                  ) : used > 0 ? (
                    <span
                      title={`${used} placed (no limit)`}
                      style={{
                        fontSize: 10,
                        fontVariantNumeric: "tabular-nums",
                        padding: "1px 6px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.06)",
                        color: "#9ca3af",
                        border: "1px solid rgba(255,255,255,0.08)",
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
