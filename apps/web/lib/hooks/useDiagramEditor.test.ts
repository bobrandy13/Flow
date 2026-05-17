import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDiagramEditor } from "./useDiagramEditor";
import type { Diagram } from "@flow/shared/types/diagram";

describe("useDiagramEditor", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") window.localStorage.clear();
  });

  it("starts with an empty diagram by default", () => {
    const { result } = renderHook(() => useDiagramEditor());
    expect(result.current.diagram.nodes).toEqual([]);
    expect(result.current.diagram.edges).toEqual([]);
  });

  it("starts with the provided initial diagram", () => {
    const initial: Diagram = {
      nodes: [{ id: "n1", kind: "server", position: { x: 10, y: 20 } }],
      edges: [],
    };
    const { result } = renderHook(() => useDiagramEditor({ initialDiagram: initial }));
    expect(result.current.diagram.nodes).toHaveLength(1);
    expect(result.current.diagram.nodes[0].id).toBe("n1");
  });

  it("addNode appends a node to the diagram", () => {
    const { result } = renderHook(() => useDiagramEditor());
    act(() => {
      result.current.addNode("server");
    });
    expect(result.current.diagram.nodes).toHaveLength(1);
    expect(result.current.diagram.nodes[0].kind).toBe("server");
  });

  it("addNode respects maxOf caps", () => {
    const { result } = renderHook(() =>
      useDiagramEditor({ maxOf: { server: 1 } }),
    );
    act(() => {
      result.current.addNode("server");
      result.current.addNode("server"); // should be blocked
    });
    expect(result.current.diagram.nodes).toHaveLength(1);
  });

  it("addNode uses provided position", () => {
    const { result } = renderHook(() => useDiagramEditor());
    act(() => {
      result.current.addNode("database", { x: 100, y: 200 });
    });
    expect(result.current.diagram.nodes[0].position).toEqual({ x: 100, y: 200 });
  });

  it("handleDiagramChange updates diagram with undo snapshot", () => {
    const { result } = renderHook(() => useDiagramEditor());
    const newDiagram: Diagram = {
      nodes: [{ id: "n1", kind: "cache", position: { x: 0, y: 0 } }],
      edges: [],
    };
    act(() => {
      result.current.handleDiagramChange(newDiagram);
    });
    expect(result.current.diagram).toEqual(newDiagram);

    // Undo should restore empty
    act(() => {
      result.current.handleUndo();
    });
    expect(result.current.diagram.nodes).toHaveLength(0);
  });

  it("handleUndo does nothing when history is empty", () => {
    const { result } = renderHook(() => useDiagramEditor());
    act(() => {
      result.current.handleUndo();
    });
    expect(result.current.diagram.nodes).toHaveLength(0);
  });

  it("supports multiple undo steps", () => {
    const { result } = renderHook(() => useDiagramEditor());
    act(() => {
      result.current.addNode("server");
    });
    act(() => {
      result.current.addNode("database");
    });
    expect(result.current.diagram.nodes).toHaveLength(2);

    act(() => {
      result.current.handleUndo();
    });
    expect(result.current.diagram.nodes).toHaveLength(1);
    expect(result.current.diagram.nodes[0].kind).toBe("server");

    act(() => {
      result.current.handleUndo();
    });
    expect(result.current.diagram.nodes).toHaveLength(0);
  });

  it("handleReset clears diagram and selection", () => {
    const { result } = renderHook(() => useDiagramEditor());
    act(() => {
      result.current.addNode("server");
      result.current.setSelectedNodeId("n1");
      result.current.setSelectedEdgeId("e1");
    });
    act(() => {
      result.current.handleReset();
    });
    expect(result.current.diagram.nodes).toHaveLength(0);
    expect(result.current.selectedNodeId).toBeUndefined();
    expect(result.current.selectedEdgeId).toBeUndefined();
  });

  it("handleReset clears undo history", () => {
    const { result } = renderHook(() => useDiagramEditor());
    act(() => {
      result.current.addNode("server");
    });
    act(() => {
      result.current.handleReset();
    });
    // Undo should do nothing after reset
    act(() => {
      result.current.handleUndo();
    });
    expect(result.current.diagram.nodes).toHaveLength(0);
  });

  it("selection state works independently", () => {
    const { result } = renderHook(() => useDiagramEditor());
    act(() => {
      result.current.setSelectedNodeId("node-1");
      result.current.setSelectedEdgeId("edge-1");
    });
    expect(result.current.selectedNodeId).toBe("node-1");
    expect(result.current.selectedEdgeId).toBe("edge-1");
  });

  it("limits undo history to 50 entries", () => {
    const { result } = renderHook(() => useDiagramEditor());
    // Add 55 nodes (each addNode pushes to history)
    for (let i = 0; i < 55; i++) {
      act(() => {
        result.current.addNode("server");
      });
    }
    expect(result.current.diagram.nodes).toHaveLength(55);

    // Undo 50 times should work
    for (let i = 0; i < 50; i++) {
      act(() => {
        result.current.handleUndo();
      });
    }
    expect(result.current.diagram.nodes).toHaveLength(5);

    // 51st undo should do nothing (history capped at 50)
    act(() => {
      result.current.handleUndo();
    });
    expect(result.current.diagram.nodes).toHaveLength(5);
  });

  it("adds load_balancer with default fanOut config", () => {
    const { result } = renderHook(() => useDiagramEditor());
    act(() => {
      result.current.addNode("load_balancer");
    });
    expect(result.current.diagram.nodes[0].config).toBeDefined();
    expect(result.current.diagram.nodes[0].config).toMatchObject({
      fanOut: expect.any(String),
    });
  });
});
