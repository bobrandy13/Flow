import type { Diagram } from "../types/diagram";
import type { TickFrame, SimulationOutcome } from "../types/validation";
import { COMPONENT_SPECS } from "./component-specs";
import { ticksToMs } from "./units";
import { exportDiagram } from "./export-diagram";

interface BuildLogsInput {
  levelId?: string;
  levelTitle?: string;
  diagram: Diagram;
  outcome: SimulationOutcome;
  frames?: TickFrame[];
  /** Per-node final snapshot (last frame's perNode), used when `frames` is omitted. */
  finalPerNode?: TickFrame["perNode"];
  /** SLA from the level, for context. */
  sla?: { minSuccessRate?: number; p95LatencyMaxTicks?: number };
}

/**
 * Build a plain-text diagnostic dump of a simulation run, intended for the
 * "Copy Logs" button on the results panel. Designed to be paste-friendly into
 * a chat or bug report.
 */
export function buildSimulationLogs(input: BuildLogsInput): string {
  const { diagram, outcome, frames, finalPerNode, sla, levelId, levelTitle } = input;
  const lines: string[] = [];
  const finalFrame = frames && frames.length > 0 ? frames[frames.length - 1] : null;
  const perNode = finalFrame?.perNode ?? finalPerNode ?? {};

  lines.push("=== Flow simulation logs ===");
  if (levelId || levelTitle) {
    lines.push(`Level: ${levelTitle ?? "(unknown)"} (${levelId ?? "?"})`);
  }
  lines.push(`Verdict: ${outcome.passed ? "PASS ✅" : "FAIL ❌"}`);
  if (sla) {
    const slaParts: string[] = [];
    if (typeof sla.minSuccessRate === "number") {
      slaParts.push(`success ≥ ${(sla.minSuccessRate * 100).toFixed(1)}%`);
    }
    if (typeof sla.p95LatencyMaxTicks === "number") {
      slaParts.push(`p95 ≤ ${ticksToMs(sla.p95LatencyMaxTicks)}ms`);
    }
    if (slaParts.length) lines.push(`SLA: ${slaParts.join(", ")}`);
  }

  lines.push("");
  lines.push("--- Final metrics ---");
  const m = outcome.metrics;
  lines.push(`Success rate : ${(m.successRate * 100).toFixed(1)}%`);
  lines.push(`Avg latency  : ${formatMs(ticksToMs(m.avgLatency))} ms (${m.avgLatency.toFixed(2)} ticks)`);
  lines.push(`p95 latency  : ${formatMs(ticksToMs(m.p95Latency))} ms (${m.p95Latency.toFixed(2)} ticks)`);
  lines.push(`Drops        : ${m.drops}`);
  if (m.bottleneckNodeId) {
    const node = diagram.nodes.find((n) => n.id === m.bottleneckNodeId);
    const label = node ? `${COMPONENT_SPECS[node.kind].emoji} ${COMPONENT_SPECS[node.kind].label}` : m.bottleneckNodeId;
    lines.push(`Bottleneck   : ${label} (${m.bottleneckNodeId})`);
  }

  if (Object.keys(perNode).length > 0) {
    lines.push("");
    lines.push("--- Per-node summary (final tick) ---");
    const idWidth = Math.max(14, ...diagram.nodes.map((node) => node.id.length)) + 2;
    const kindWidth = Math.max(16, ...diagram.nodes.map((node) => COMPONENT_SPECS[node.kind].label.length)) + 2;
    lines.push(
      "id".padEnd(idWidth) +
        "kind".padEnd(kindWidth) +
        "served".padStart(8) +
        "dropped".padStart(9) +
        "peakInFlt".padStart(11) +
        "cap".padStart(7) +
        "peakUtil".padStart(11),
    );
    for (const node of diagram.nodes) {
      const snap = perNode[node.id];
      if (!snap) continue;
      const spec = COMPONENT_SPECS[node.kind];
      const cap = Number.isFinite(spec.capacity) ? spec.capacity : null;
      const peakUtil = cap && cap > 0 ? snap.peakInFlight / cap : 0;
      lines.push(
        node.id.padEnd(idWidth) +
          COMPONENT_SPECS[node.kind].label.padEnd(kindWidth) +
          String(snap.servedTotal).padStart(8) +
          String(snap.droppedTotal).padStart(9) +
          String(snap.peakInFlight).padStart(11) +
          String(cap ?? "∞").padStart(7) +
          (cap ? `${(peakUtil * 100).toFixed(0)}%` : "-").padStart(11),
      );
      if (node.kind === "queue") {
        lines.push(
          " ".repeat(idWidth) +
            `peakPendingDepth=${snap.peakPendingDepth} (currently ${snap.pendingDepth})`,
        );
      }
    }

    const queueNotes = buildQueueNotes(diagram, perNode);
    if (queueNotes.length > 0) {
      lines.push("");
      lines.push("--- Queue notes ---");
      lines.push(...queueNotes);
    }

    const droppedNodes = diagram.nodes
      .filter((n) => (perNode[n.id]?.droppedTotal ?? 0) > 0)
      .sort((a, b) => (perNode[b.id]?.droppedTotal ?? 0) - (perNode[a.id]?.droppedTotal ?? 0));
    if (droppedNodes.length > 0) {
      lines.push("");
      lines.push("--- Drops by node ---");
      for (const n of droppedNodes) {
        const snap = perNode[n.id]!;
        const spec = COMPONENT_SPECS[n.kind];
        lines.push(
          `${spec.emoji} ${spec.label} (${n.id}): ${snap.droppedTotal} dropped. Capacity ${Number.isFinite(spec.capacity) ? spec.capacity : "∞"} was reached when a new request arrived with no free slot.`,
        );
      }
    } else if (m.drops === 0) {
      lines.push("");
      lines.push("Note: no drops. (A node hitting peak inFlight = capacity is fine. Drops only occur when a new request arrives at a node already at capacity.)");
    }
  }

  if (frames && frames.length > 0) {
    const dropTicks: string[] = [];
    for (const f of frames) {
      const ticks: string[] = [];
      for (const node of diagram.nodes) {
        const snap = f.perNode[node.id];
        if (snap && snap.droppedThisTick > 0) {
          ticks.push(`${node.id}=${snap.droppedThisTick}`);
        }
      }
      if (ticks.length > 0) {
        dropTicks.push(`tick ${f.tick.toString().padStart(3)}: ${ticks.join(", ")}`);
      }
    }
    if (dropTicks.length > 0) {
      lines.push("");
      lines.push(`--- Drop events (${dropTicks.length} ticks had drops) ---`);
      for (const line of dropTicks.slice(0, 50)) lines.push(line);
      if (dropTicks.length > 50) lines.push(`… (${dropTicks.length - 50} more)`);
    }
  }

  lines.push("");
  lines.push("--- Diagram ---");
  lines.push(JSON.stringify(exportDiagram(diagram), null, 2));

  return lines.join("\n");
}

function formatMs(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function buildQueueNotes(diagram: Diagram, perNode: TickFrame["perNode"]): string[] {
  const notes: string[] = [];
  for (const queue of diagram.nodes.filter((node) => node.kind === "queue")) {
    const queueSnap = perNode[queue.id];
    if (!queueSnap) continue;
    const consumers = diagram.edges
      .filter((edge) => edge.fromNodeId === queue.id)
      .map((edge) => diagram.nodes.find((node) => node.id === edge.toNodeId))
      .filter((node): node is Diagram["nodes"][number] => Boolean(node));
    if (consumers.length === 0) {
      notes.push(`Queue ${queue.id} has no consumer edge. Add Queue -> Database or Queue -> Server so jobs can drain.`);
      continue;
    }
    const consumerLabels = consumers
      .map((node) => `${COMPONENT_SPECS[node.kind].label} (${node.id})`)
      .join(", ");
    notes.push(
      `Queue ${queue.id} buffered up to ${queueSnap.peakPendingDepth} jobs. Its consumer path is ${consumerLabels}.`,
    );
    for (const consumer of consumers) {
      const snap = perNode[consumer.id];
      const spec = COMPONENT_SPECS[consumer.kind];
      if (!snap) continue;
      const cap = Number.isFinite(spec.capacity) ? spec.capacity : null;
      if (cap && snap.peakInFlight >= cap && snap.droppedTotal === 0) {
        notes.push(
          `${spec.label} (${consumer.id}) reached full capacity while draining the queue, but dropped nothing. That means the queue smoothed arrivals and kept it busy rather than overloaded.`,
        );
      }
    }
  }
  return notes;
}
