import { describe, it, expect } from "vitest";
import { canSimulate, diagramSimulatabilityIssue } from "../engine/simulatability";
import type { Diagram } from "../types/diagram";

describe("simulatability", () => {
  it("rejects an empty diagram with a friendly message", () => {
    const issue = diagramSimulatabilityIssue({ nodes: [], edges: [] });
    expect(issue).toMatch(/client/i);
    expect(canSimulate({ nodes: [], edges: [] })).toBe(false);
  });

  it("rejects a diagram with no client", () => {
    const d: Diagram = {
      nodes: [{ id: "s", kind: "server", position: { x: 0, y: 0 } }],
      edges: [],
    };
    expect(canSimulate(d)).toBe(false);
  });

  it("rejects a client with no outgoing edges", () => {
    const d: Diagram = {
      nodes: [
        { id: "c", kind: "client", position: { x: 0, y: 0 } },
        { id: "s", kind: "server", position: { x: 0, y: 0 } },
      ],
      edges: [], // disconnected
    };
    const issue = diagramSimulatabilityIssue(d);
    expect(issue).toMatch(/connect/i);
    expect(canSimulate(d)).toBe(false);
  });

  it("accepts the minimum: client → server (regardless of return path)", () => {
    const d: Diagram = {
      nodes: [
        { id: "c", kind: "client", position: { x: 0, y: 0 } },
        { id: "s", kind: "server", position: { x: 0, y: 0 } },
      ],
      edges: [{ id: "e1", fromNodeId: "c", toNodeId: "s" }],
    };
    expect(canSimulate(d)).toBe(true);
    expect(diagramSimulatabilityIssue(d)).toBeNull();
  });

  /**
   * Sandbox mode: a level's structural rules (e.g. "must contain a queue")
   * are NOT consulted by simulatability. The whole point is to let the
   * player run a "wrong" design and watch what happens.
   */
  it("accepts a structurally-incomplete design (no queue) so the player can sandbox it", () => {
    const d: Diagram = {
      nodes: [
        { id: "c", kind: "client", position: { x: 0, y: 0 } },
        { id: "s", kind: "server", position: { x: 0, y: 0 } },
        { id: "db", kind: "database", position: { x: 0, y: 0 } },
      ],
      edges: [
        { id: "e1", fromNodeId: "c", toNodeId: "s" },
        { id: "e2", fromNodeId: "s", toNodeId: "db" },
      ],
    };
    expect(canSimulate(d)).toBe(true);
  });

  /**
   * Real-world clients talk to a single entry point (LB, gateway, CDN), not
   * directly to multiple backends. Catch the anti-pattern up front so the
   * player learns to put a proper front door in place.
   */
  it("rejects a client wired directly to multiple backends", () => {
    const d: Diagram = {
      nodes: [
        { id: "c", kind: "client", position: { x: 0, y: 0 } },
        { id: "s1", kind: "server", position: { x: 0, y: 0 } },
        { id: "s2", kind: "server", position: { x: 0, y: 0 } },
      ],
      edges: [
        { id: "e1", fromNodeId: "c", toNodeId: "s1" },
        { id: "e2", fromNodeId: "c", toNodeId: "s2" },
      ],
    };
    const issue = diagramSimulatabilityIssue(d);
    expect(issue).toMatch(/single entry point|load balancer/i);
    expect(canSimulate(d)).toBe(false);
  });

  it("accepts a client with multiple edges all pointing to the same target (idempotent)", () => {
    const d: Diagram = {
      nodes: [
        { id: "c", kind: "client", position: { x: 0, y: 0 } },
        { id: "lb", kind: "load_balancer", position: { x: 0, y: 0 } },
      ],
      edges: [
        { id: "e1", fromNodeId: "c", toNodeId: "lb" },
        { id: "e2", fromNodeId: "c", toNodeId: "lb" },
      ],
    };
    expect(canSimulate(d)).toBe(true);
  });
});
