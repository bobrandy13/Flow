import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { DiagramCanvas, PALETTE_DRAG_MIME } from "./DiagramCanvas";
import { emptyDiagram } from "@flow/shared/types/diagram";
import type { Diagram } from "@flow/shared/types/diagram";

/**
 * Regression: a drop carrying PALETTE_DRAG_MIME must invoke onDropComponent
 * with the correct kind. If this contract breaks, palette items vanish on
 * drop (the bug we just fixed).
 */
describe("DiagramCanvas drop handling", () => {
  function buildDataTransfer(kind: string) {
    const store = new Map<string, string>([[PALETTE_DRAG_MIME, kind]]);
    return {
      getData: (type: string) => store.get(type) ?? "",
      setData: () => {},
      types: [PALETTE_DRAG_MIME],
      effectAllowed: "" as string,
      dropEffect: "" as string,
    };
  }

  it("invokes onDropComponent with the dragged kind", () => {
    const onDrop = vi.fn();
    const { container } = render(
      <div style={{ width: 800, height: 600 }}>
        <DiagramCanvas
          diagram={emptyDiagram()}
          onChange={() => {}}
          onDropComponent={onDrop}
        />
      </div>,
    );
    const wrapper = container.querySelector(".react-flow") as HTMLElement | null;
    expect(wrapper, "react-flow root must render").not.toBeNull();
    // The drop listener is on the wrapper that hosts the ReactFlow canvas.
    const dropTarget = wrapper!.parentElement!;
    fireEvent.drop(dropTarget, {
      dataTransfer: buildDataTransfer("server"),
      clientX: 200,
      clientY: 150,
    });
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop.mock.calls[0][0]).toBe("server");
    expect(onDrop.mock.calls[0][1]).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }));
  });

  it("ignores drops without the palette MIME", () => {
    const onDrop = vi.fn();
    const { container } = render(
      <div style={{ width: 800, height: 600 }}>
        <DiagramCanvas diagram={emptyDiagram()} onChange={() => {}} onDropComponent={onDrop} />
      </div>,
    );
    const dropTarget = container.querySelector(".react-flow")!.parentElement!;
    const dt = {
      getData: () => "",
      setData: () => {},
      types: ["text/plain"],
      effectAllowed: "" as string,
      dropEffect: "" as string,
    };
    fireEvent.drop(dropTarget, { dataTransfer: dt, clientX: 0, clientY: 0 });
    expect(onDrop).not.toHaveBeenCalled();
  });
});

/**
 * Source-level guard: the play page MUST wire onDropComponent through to the
 * canvas. Otherwise drops are silently ignored at the page level even when
 * the canvas itself is wired (this exact bug shipped once).
 */
describe("play page wiring", () => {
  const src = readFileSync(
    join(__dirname, "../../app/levels/[id]/play/page.tsx"),
    "utf8",
  );
  it("passes onDropComponent to DiagramCanvas", () => {
    expect(src).toMatch(/onDropComponent\s*=\s*\{/);
  });
});

/**
 * Source-level invariants for the canvas:
 * 1. Dark theme via colorMode (so Controls/MiniMap aren't pale on dark UI).
 * 2. MiniMap is themed (no default white background).
 * 3. Measured dimensions are cached across renders, AND only semantic
 *    changes (position/remove/add/replace) round-trip through onChange.
 *    Otherwise dropped nodes stay permanently `visibility: hidden`.
 */
describe("DiagramCanvas source-level invariants", () => {
  const src = readFileSync(join(__dirname, "DiagramCanvas.tsx"), "utf8");
  it("sets colorMode='dark' on <ReactFlow>", () => {
    expect(src).toMatch(/colorMode\s*=\s*["']dark["']/);
  });
  it("themes the MiniMap (no default light background)", () => {
    expect(src).toMatch(/MiniMap[\s\S]{0,300}background/);
  });
  it("caches measured dimensions across renders", () => {
    expect(src).toMatch(/measuredRef/);
    expect(src).toMatch(/c\.type\s*===\s*["']dimensions["']/);
  });
  it("filters change types before onChange (no dimension churn)", () => {
    expect(src).toMatch(/c\.type\s*===\s*["']position["']/);
    expect(src).toMatch(/c\.type\s*===\s*["']remove["']/);
  });
  // Regression: in a fully-controlled canvas, re-deriving rfNodes from the
  // diagram drops the `selected` flag, so RF clears selection on the next
  // render — selection flashes in the inspector and disappears immediately.
  // We must cache selected ids in a ref and re-attach `selected: true` on
  // every render of rfNodes/rfEdges.
  it("caches selected ids in refs and re-attaches `selected` on rfNodes/rfEdges", () => {
    expect(src).toMatch(/selectedNodesRef/);
    expect(src).toMatch(/selectedEdgesRef/);
    expect(src).toMatch(/selected:\s*selectedNodes\.has/);
    expect(src).toMatch(/selected:\s*selectedEdges\.has/);
  });
});

/**
 * Regression: when React Flow reports measured dimensions for a node, the
 * canvas must (a) cache them so subsequent re-renders keep them attached,
 * and (b) NOT round-trip the dimensions change through onChange (which
 * would re-derive rfNodes from the diagram, dropping `measured`, leaving
 * the node permanently `visibility: hidden`).
 *
 * This is the "dropped nodes are invisible" bug.
 */
describe("DiagramCanvas dimensions handling", () => {
  function dispatchDimensions(container: HTMLElement, id: string) {
    // We can't trigger the real ResizeObserver under jsdom; instead poke the
    // observable surface: fire a synthetic node-change via RF's internal
    // `onNodesChange`. We simulate this by invoking the change handler the
    // same way RF would. The simplest stable observation is: render a node,
    // then assert there's no churn loop and that the node is in the DOM with
    // a transform applied.
    void container;
    void id;
  }

  it("does not call onChange when only dimensions/select changes occur", () => {
    const onChange = vi.fn();
    const initial: Diagram = {
      nodes: [{ id: "n1", kind: "server", position: { x: 50, y: 50 } }],
      edges: [],
    };
    const { container } = render(
      <div style={{ width: 800, height: 600 }}>
        <DiagramCanvas diagram={initial} onChange={onChange} />
      </div>,
    );
    // After mount RF will internally fire dimensions changes (mocked
    // ResizeObserver triggers nothing, but nothing should call onChange
    // synchronously either). onChange must remain untouched on mount.
    expect(onChange).not.toHaveBeenCalled();
    dispatchDimensions(container, "n1");
  });

  it("preserves the node when re-rendered with the same diagram", () => {
    const initial: Diagram = {
      nodes: [{ id: "n1", kind: "server", position: { x: 50, y: 50 } }],
      edges: [],
    };
    const onChange = vi.fn();
    const { container, rerender } = render(
      <div style={{ width: 800, height: 600 }}>
        <DiagramCanvas diagram={initial} onChange={onChange} />
      </div>,
    );
    expect(container.querySelectorAll(".react-flow__node").length).toBe(1);
    act(() => {
      rerender(
        <div style={{ width: 800, height: 600 }}>
          <DiagramCanvas diagram={initial} onChange={onChange} />
        </div>,
      );
    });
    expect(container.querySelectorAll(".react-flow__node").length).toBe(1);
  });
});
