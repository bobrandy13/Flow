"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "flow.inspectorWidth.v1";
const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 240;
const MAX_WIDTH = 600;
const COLLAPSED_WIDTH = 40;

interface ResizableSidePanelProps {
  children: React.ReactNode;
  /** Override the storage key (mostly useful for tests). */
  storageKey?: string;
}

/**
 * Right-side container that holds the inspectors / simulation results.
 * Drag the left edge to resize (min 240, max 600px). Click the chevron at
 * the top of the handle to collapse/expand. Width persists in localStorage.
 *
 * Implemented as a draggable splitter rather than CSS resize so we can clamp
 * the range, persist the value, and animate the collapse smoothly.
 */
export function ResizableSidePanel({ children, storageKey = STORAGE_KEY }: ResizableSidePanelProps) {
  const [width, setWidth] = useState<number>(DEFAULT_WIDTH);
  const [collapsed, setCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartWidthRef = useRef<number>(DEFAULT_WIDTH);

  // Hydrate width from localStorage on mount. Standard hydration pattern:
  // read browser-only storage after the server-rendered shell mounts.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { width?: number; collapsed?: boolean };
        if (typeof parsed.width === "number" && Number.isFinite(parsed.width)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount, deps are stable
          setWidth(clamp(parsed.width, MIN_WIDTH, MAX_WIDTH));
        }
        if (typeof parsed.collapsed === "boolean") {
          setCollapsed(parsed.collapsed);
        }
      }
    } catch {
      // ignore corrupt JSON
    }
  }, [storageKey]);

  const persist = useCallback(
    (next: { width?: number; collapsed?: boolean }) => {
      if (typeof window === "undefined") return;
      try {
        const raw = window.localStorage.getItem(storageKey);
        const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        window.localStorage.setItem(storageKey, JSON.stringify({ ...prev, ...next }));
      } catch {
        // ignore quota
      }
    },
    [storageKey],
  );

  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (collapsed) return;
      e.preventDefault();
      dragStartXRef.current = e.clientX;
      dragStartWidthRef.current = width;
      setIsDragging(true);
    },
    [collapsed, width],
  );

  // Track mouse globally while dragging so movement outside the handle still works.
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      if (dragStartXRef.current == null) return;
      // Side panel is on the RIGHT; dragging the left edge LEFT widens it.
      const delta = dragStartXRef.current - e.clientX;
      const next = clamp(dragStartWidthRef.current + delta, MIN_WIDTH, MAX_WIDTH);
      setWidth(next);
    };
    const onUp = () => {
      setIsDragging(false);
      dragStartXRef.current = null;
      // Persist once at the end of the drag (avoid spamming localStorage).
      persist({ width });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, width, persist]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      persist({ collapsed: next });
      return next;
    });
  }, [persist]);

  const effectiveWidth = collapsed ? COLLAPSED_WIDTH : width;

  return (
    <div
      data-testid="resizable-side-panel"
      data-collapsed={collapsed ? "true" : "false"}
      style={{
        position: "relative",
        width: effectiveWidth,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        minWidth: collapsed ? COLLAPSED_WIDTH : MIN_WIDTH,
        background: "#0b1020",
        borderLeft: "1px solid #1f2937",
        transition: isDragging ? "none" : "width 0.18s ease",
      }}
    >
      {/* Drag handle on the left edge */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize side panel"
        onMouseDown={onDragStart}
        data-testid="side-panel-resize-handle"
        style={{
          position: "absolute",
          left: -3,
          top: 0,
          bottom: 0,
          width: 6,
          cursor: collapsed ? "default" : "ew-resize",
          zIndex: 5,
          background: isDragging ? "rgba(96,165,250,0.4)" : "transparent",
        }}
      />
      {/* Collapse / expand toggle */}
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand side panel" : "Collapse side panel"}
        aria-expanded={!collapsed}
        data-testid="side-panel-toggle"
        style={{
          position: "absolute",
          left: -14,
          top: 12,
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: "1px solid #1f2937",
          background: "#0b1020",
          color: "#9ca3af",
          fontSize: 11,
          cursor: "pointer",
          zIndex: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        {collapsed ? "‹" : "›"}
      </button>
      {/* Children only render when expanded so they don't claim hit-targets. */}
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
