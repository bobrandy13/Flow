"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

export interface DeletableEdgeData {
  /** Optional label rendered at the midpoint (e.g. "+80ms", "hit 80%"). */
  midLabel?: string;
  midLabelStyle?: React.CSSProperties;
  /** Called when the user clicks the ✕ button. */
  onDelete?: (id: string) => void;
}

/**
 * Custom edge that renders a ✕ button at its midpoint when selected.
 * Clicking the button removes the edge — bypasses ReactFlow's flaky
 * Backspace handling in fully-controlled canvases.
 */
export function DeletableEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    selected,
    style,
    markerEnd,
    data,
  } = props;
  const edgeData = data as DeletableEdgeData | undefined;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
        interactionWidth={24}
      />
      <EdgeLabelRenderer>
        {edgeData?.midLabel && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 18}px)`,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11,
              padding: "2px 5px",
              background: "rgba(14, 26, 43, 0.92)",
              border: "1px solid rgba(122, 223, 255, 0.25)",
              borderRadius: 3,
              pointerEvents: "none",
              ...edgeData.midLabelStyle,
            }}
          >
            {edgeData.midLabel}
          </div>
        )}
        <button
          type="button"
          data-testid={`edge-delete-${id}`}
          className="nodrag nopan"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            edgeData?.onDelete?.(id);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.boxShadow = "0 0 8px rgba(56, 189, 248, 0.9)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = selected ? "1" : "0.55";
            e.currentTarget.style.boxShadow = selected
              ? "0 0 6px rgba(56, 189, 248, 0.6)"
              : "none";
          }}
          title="Delete edge"
          aria-label="Delete edge"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            width: 20,
            height: 20,
            borderRadius: 10,
            border: "1px solid #38bdf8",
            background: "#0e1a2b",
            color: "#38bdf8",
            fontSize: 12,
            lineHeight: "18px",
            cursor: "pointer",
            padding: 0,
            opacity: selected ? 1 : 0.55,
            boxShadow: selected ? "0 0 6px rgba(56, 189, 248, 0.6)" : "none",
            pointerEvents: "all",
            transition: "opacity 120ms, box-shadow 120ms",
          }}
        >
          ✕
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
