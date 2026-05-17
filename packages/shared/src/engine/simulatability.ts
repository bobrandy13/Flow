import type { Diagram } from "../types/diagram";

/**
 * Minimum-viable check for "is this diagram worth shipping to the sim?"
 *
 * The level's structural rules are intentionally NOT consulted here: the
 * player should be able to run a half-built or "wrong" design and watch
 * what happens (e.g. drop the queue from "Smooth the Burst" and observe
 * the server overload). That hands-on experimentation is the whole point.
 *
 * We only block the sim when there's literally nothing to simulate:
 *   - at least one client (otherwise the simulator immediately bails),
 *   - at least one outgoing edge from a client (otherwise no requests
 *     ever leave the client and the run is a 60-tick no-op).
 *
 * Returns a string explaining the blocker, or null when the diagram is
 * simulatable.
 */
export function diagramSimulatabilityIssue(diagram: Diagram): string | null {
  const clients = diagram.nodes.filter((n) => n.kind === "client");
  if (clients.length === 0) {
    return "Add a client: every system needs somewhere for traffic to come from.";
  }
  const clientIds = new Set(clients.map((c) => c.id));
  const hasClientOutgoing = diagram.edges.some((e) => clientIds.has(e.fromNodeId));
  if (!hasClientOutgoing) {
    return "Connect your client to something: requests need somewhere to go.";
  }
  // Real-world clients talk to a single entry point (a load balancer, API gateway,
  // CDN, etc.). They don't fan out to multiple backends directly. Catch the
  // anti-pattern early so the player adds a proper front door instead.
  for (const client of clients) {
    const downstream = new Set(
      diagram.edges
        .filter((e) => e.fromNodeId === client.id)
        .map((e) => e.toNodeId),
    );
    if (downstream.size > 1) {
      return "A client should talk to a single entry point. Put a load balancer (or API gateway) in front and have the client connect only to that.";
    }
  }
  return null;
}

export function canSimulate(diagram: Diagram): boolean {
  return diagramSimulatabilityIssue(diagram) === null;
}
