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
    expect(r.message).toBe(
      "Add a Cache node (none are on the canvas yet). For this lesson, the cache should sit on the read path: Server -> Cache -> Database.",
    );
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

  it("explains the intended cache wiring when the server is not connected to cache", () => {
    const [r] = evaluateRules(diagram, [{ type: "requires_path", from: "server", to: "cache" }]);
    expect(r.passed).toBe(false);
    expect(r.message).toBe(
      "Add the missing Cache node first, then wire Server -> Cache. Connect Server -> Cache so repeated reads can return quickly instead of making every request wait on the database. For misses, continue with Cache -> Database.",
    );
  });

  it("uses component labels instead of raw component ids in path messages", () => {
    const [r] = evaluateRules(diagram, [{ type: "requires_path", from: "client", to: "load_balancer" }]);
    expect(r.passed).toBe(true);
    expect(r.message).toBe("Path exists: Client -> Load Balancer.");
  });
});
