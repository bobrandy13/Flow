import { describe, it, expect, beforeEach } from "vitest";
import {
  listSandboxDesigns,
  loadSandboxDesign,
  saveSandboxDesign,
  deleteSandboxDesign,
} from "./sandbox";
import type { Diagram } from "@flow/shared/types/diagram";

const testDiagram: Diagram = {
  nodes: [{ id: "n1", kind: "server", position: { x: 0, y: 0 } }],
  edges: [{ id: "e1", fromNodeId: "n1", toNodeId: "n1" }],
};

describe("sandbox storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads a design", () => {
    saveSandboxDesign("my-design", testDiagram);
    const loaded = loadSandboxDesign("my-design");
    expect(loaded).toEqual(testDiagram);
  });

  it("returns null for non-existent design", () => {
    expect(loadSandboxDesign("nope")).toBeNull();
  });

  it("lists saved designs sorted by most recent", () => {
    // Manually set different timestamps to ensure sort order
    localStorage.setItem(
      "flow:sandbox:old",
      JSON.stringify({ name: "old", diagram: testDiagram, updatedAt: "2024-01-01T00:00:00Z" }),
    );
    localStorage.setItem(
      "flow:sandbox:new",
      JSON.stringify({ name: "new", diagram: testDiagram, updatedAt: "2024-06-01T00:00:00Z" }),
    );
    const list = listSandboxDesigns();
    expect(list.length).toBe(2);
    expect(list[0].name).toBe("new");
    expect(list[1].name).toBe("old");
  });

  it("overwrites existing design on save", () => {
    saveSandboxDesign("x", testDiagram);
    const updated: Diagram = { nodes: [], edges: [] };
    saveSandboxDesign("x", updated);
    expect(loadSandboxDesign("x")).toEqual(updated);
    expect(listSandboxDesigns().length).toBe(1);
  });

  it("deletes a design", () => {
    saveSandboxDesign("del-me", testDiagram);
    deleteSandboxDesign("del-me");
    expect(loadSandboxDesign("del-me")).toBeNull();
    expect(listSandboxDesigns().length).toBe(0);
  });

  it("ignores non-sandbox localStorage keys", () => {
    localStorage.setItem("other-key", "value");
    saveSandboxDesign("mine", testDiagram);
    expect(listSandboxDesigns().length).toBe(1);
    expect(listSandboxDesigns()[0].name).toBe("mine");
  });
});
