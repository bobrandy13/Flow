import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ResizableSidePanel } from "./ResizableSidePanel";

const KEY = "flow.test.inspectorWidth.v1";

describe("ResizableSidePanel", () => {
  beforeEach(() => {
    window.localStorage.clear();
    cleanup();
  });

  it("renders children at the default width when no localStorage value is set", () => {
    render(
      <ResizableSidePanel storageKey={KEY}>
        <div>panel-contents</div>
      </ResizableSidePanel>,
    );
    const panel = screen.getByTestId("resizable-side-panel");
    expect(panel).toHaveStyle({ width: "320px" });
    expect(screen.getByText("panel-contents")).toBeInTheDocument();
  });

  it("hydrates width and collapsed state from localStorage", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ width: 480, collapsed: false }));
    render(
      <ResizableSidePanel storageKey={KEY}>
        <div>x</div>
      </ResizableSidePanel>,
    );
    expect(screen.getByTestId("resizable-side-panel")).toHaveStyle({ width: "480px" });
  });

  it("clamps an out-of-range stored width to MIN/MAX", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ width: 9999 }));
    render(
      <ResizableSidePanel storageKey={KEY}>
        <div>x</div>
      </ResizableSidePanel>,
    );
    // Max is 600.
    expect(screen.getByTestId("resizable-side-panel")).toHaveStyle({ width: "600px" });
  });

  it("collapses and expands via the toggle button, persisting to localStorage", () => {
    render(
      <ResizableSidePanel storageKey={KEY}>
        <div>panel-contents</div>
      </ResizableSidePanel>,
    );
    const toggle = screen.getByTestId("side-panel-toggle");
    expect(screen.getByText("panel-contents")).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByText("panel-contents")).not.toBeInTheDocument();
    expect(screen.getByTestId("resizable-side-panel")).toHaveAttribute("data-collapsed", "true");
    // Persisted.
    const raw = window.localStorage.getItem(KEY);
    expect(raw).toContain('"collapsed":true');
    fireEvent.click(toggle);
    expect(screen.getByText("panel-contents")).toBeInTheDocument();
  });

  /**
   * Regression: dragging the resize handle leftward must widen the panel
   * (the panel is on the right; moving the handle leftward grows the panel).
   * If we ever invert the math the test should fail loudly.
   */
  it("REGRESSION: dragging handle left widens, dragging right narrows (clamped)", () => {
    render(
      <ResizableSidePanel storageKey={KEY}>
        <div>x</div>
      </ResizableSidePanel>,
    );
    const handle = screen.getByTestId("side-panel-resize-handle");
    fireEvent.mouseDown(handle, { clientX: 1000 });
    fireEvent.mouseMove(window, { clientX: 900 }); // moved 100px LEFT
    fireEvent.mouseUp(window);
    // Default 320 + 100 = 420 (within range)
    expect(screen.getByTestId("resizable-side-panel")).toHaveStyle({ width: "420px" });

    fireEvent.mouseDown(handle, { clientX: 900 });
    fireEvent.mouseMove(window, { clientX: 1100 }); // moved 200px RIGHT
    fireEvent.mouseUp(window);
    // 420 - 200 = 220, clamped to MIN 240
    expect(screen.getByTestId("resizable-side-panel")).toHaveStyle({ width: "240px" });
  });

  it("persists the dragged width to localStorage on mouseup", () => {
    render(
      <ResizableSidePanel storageKey={KEY}>
        <div>x</div>
      </ResizableSidePanel>,
    );
    const handle = screen.getByTestId("side-panel-resize-handle");
    fireEvent.mouseDown(handle, { clientX: 1000 });
    fireEvent.mouseMove(window, { clientX: 950 });
    fireEvent.mouseUp(window);
    const raw = window.localStorage.getItem(KEY);
    expect(raw).toContain('"width":370');
  });
});
