import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, act, screen } from "@testing-library/react";
import { ReactFlowProvider, Position } from "@xyflow/react";

import { DeletableEdge, type DeletableEdgeData } from "./DeletableEdge";

// EdgeLabelRenderer uses createPortal into RF's internal `domNode` (read
// from the RF store). Outside a real ReactFlow render that node doesn't
// exist and the portal returns null. For unit tests of the edge component,
// stub EdgeLabelRenderer to render children inline.
vi.mock("@xyflow/react", async () => {
  const actual = await vi.importActual<typeof import("@xyflow/react")>("@xyflow/react");
  return {
    ...actual,
    EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

/**
 * Regression: clicking the ✕ button on a custom edge MUST invoke onDelete
 * with the edge id. This shipped broken twice — once because the click
 * handler was gated on a `selected` prop that never propagated through
 * ReactFlow's controlled-mode store, and once because the click was
 * swallowed by the canvas pan layer (missing nodrag class + pointer-events).
 *
 * If this test fails, users see a button on the canvas that does nothing.
 */
describe("DeletableEdge", () => {
  function renderEdge(props: { id?: string; selected?: boolean; onDelete?: (id: string) => void; midLabel?: string }) {
    const data: DeletableEdgeData = {
      midLabel: props.midLabel,
      onDelete: props.onDelete,
    };
    return render(
      <ReactFlowProvider>
        <svg>
          <DeletableEdge
            id={props.id ?? "e1"}
            source="n1"
            target="n2"
            sourceX={0}
            sourceY={0}
            targetX={100}
            targetY={100}
            sourcePosition={Position.Right}
            targetPosition={Position.Left}
            selected={props.selected}
            data={data as unknown as Record<string, unknown>}
          />
        </svg>
      </ReactFlowProvider>,
    );
  }

  it("renders a delete button with a test id derived from the edge id", () => {
    renderEdge({ id: "edge-abc" });
    expect(screen.getByTestId("edge-delete-edge-abc")).toBeTruthy();
  });

  it("invokes onDelete with the edge id when the ✕ button is clicked", () => {
    const onDelete = vi.fn();
    renderEdge({ id: "e1", onDelete });
    const btn = screen.getByTestId("edge-delete-e1");
    act(() => {
      fireEvent.click(btn);
    });
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("e1");
  });

  it("renders the delete button regardless of selection (always visible)", () => {
    // Critical: in fully-controlled mode the `selected` prop doesn't
    // reliably propagate from ReactFlow's internal store. We must NOT gate
    // the button on selection.
    renderEdge({ id: "e1", selected: false });
    expect(screen.getByTestId("edge-delete-e1")).toBeTruthy();
  });

  it("renders the optional midLabel when provided", () => {
    renderEdge({ midLabel: "+80ms" });
    expect(screen.getByText("+80ms")).toBeTruthy();
  });

  it("uses pointer-events: all so the click reaches the button", () => {
    renderEdge({ id: "e1" });
    const btn = screen.getByTestId("edge-delete-e1") as HTMLButtonElement;
    expect(btn.style.pointerEvents).toBe("all");
  });

  it("includes the nodrag/nopan classes so RF doesn't pan on drag-start", () => {
    renderEdge({ id: "e1" });
    const btn = screen.getByTestId("edge-delete-e1");
    const cls = btn.getAttribute("class") ?? "";
    expect(cls).toMatch(/nodrag/);
    expect(cls).toMatch(/nopan/);
  });
});
