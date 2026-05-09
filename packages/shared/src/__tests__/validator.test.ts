import { describe, it, expect } from "vitest";
import { evaluateRules, pathExists } from "../engine/validator";
import type { Diagram } from "../types/diagram";

const diagram: Diagram = {
  nodes: [
    { id: "c1", kind: "client", position: { x: 0, y: 0 } },
    { id: "lb", kind: "load_balancer", position: { x: 0, y: 0 } },
    { id: "s1", kind: "server", position: { x: 0, y: 0 } },
    { id: "s2", kind: "server", position: { x: 0, y: 0 } },
    { id: "db", kind: "database", position: { x: 0, y: 0 } },
  ],
  edges: [
    { id: "e1", fromNodeId: "c1", toNodeId: "lb" },
    { id: "e2", fromNodeId: "lb", toNodeId: "s1" },
    { id: "e3", fromNodeId: "lb", toNodeId: "s2" },
    { id: "e4", fromNodeId: "s1", toNodeId: "db" },
  ],
};

describe("validator", () => {
  it("requires_kind passes when count meets minimum", () => {
    const [r] = evaluateRules(diagram, [{ type: "requires_kind", kind: "server", min: 2 }]);
    expect(r.passed).toBe(true);
  });

  it("requires_kind fails below minimum", () => {
    const [r] = evaluateRules(diagram, [{ type: "requires_kind", kind: "cache", min: 1 }]);
    expect(r.passed).toBe(false);
  });

  it("forbidden passes when kind is absent", () => {
    const [r] = evaluateRules(diagram, [{ type: "forbidden", kind: "queue" }]);
    expect(r.passed).toBe(true);
  });

  it("forbidden fails when kind is present", () => {
    const [r] = evaluateRules(diagram, [{ type: "forbidden", kind: "server" }]);
    expect(r.passed).toBe(false);
  });

  it("requires_path finds multi-hop paths", () => {
    expect(pathExists(diagram, "client", "database")).toBe(true);
    const [r] = evaluateRules(diagram, [{ type: "requires_path", from: "client", to: "database" }]);
    expect(r.passed).toBe(true);
  });

  it("requires_path fails when no edges connect the kinds", () => {
    expect(pathExists(diagram, "client", "cache")).toBe(false);
    expect(pathExists(diagram, "database", "client")).toBe(false); // directed
  });
});
