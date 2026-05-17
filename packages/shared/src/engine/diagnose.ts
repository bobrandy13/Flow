/**
 * Mentor verdict engine. Takes a finished simulation and produces a
 * structured `Diagnosis` explaining what happened, why, and what to do next.
 *
 * Architecture: an ordered cascade of pure probes. Each probe inspects the
 * frames + outcome + diagram and either returns a `Diagnosis` (winning) or
 * `null`. First match wins, so more specific probes go first.
 *
 * The probes are deliberately conservative — they only fire when they can
 * back the diagnosis with concrete evidence. The terminal fallback ensures
 * every run gets a verdict.
 */

import type { ComponentKind } from "../types/components";
import type { Diagram, DiagramNode } from "../types/diagram";
import type { SLA, Workload } from "../types/level";
import type {
  Diagnosis,
  DiagnosisEvidence,
  NodeRuntimeSnapshot,
  SimulationMetrics,
  TickFrame,
} from "../types/validation";
import { COMPONENT_SPECS } from "./component-specs";
import { DIAGNOSIS_COPY, format } from "./diagnose-copy";
import { ticksToMs } from "./units";

interface DiagnoseArgs {
  diagram: Diagram;
  workload: Workload;
  sla: SLA;
  /** Final-tick frame snapshot. Null only in pathological pre-run failures. */
  finalFrame: TickFrame | null;
  outcome: { passed: boolean; metrics: SimulationMetrics };
}

type Probe = (ctx: ProbeCtx) => Diagnosis | null;

interface ProbeCtx extends DiagnoseArgs {
  /** Final per-node snapshot (from finalFrame, or empty when none). */
  finalPerNode: Record<string, NodeRuntimeSnapshot>;
  /** Nodes by id for quick lookup. */
  nodesById: Map<string, DiagramNode>;
  /** Total drops across all nodes in the run, from cumulative snapshots. */
  totalDrops: number;
}

/** Run the cascade. Always returns a Diagnosis. */
export function diagnose(args: DiagnoseArgs): Diagnosis {
  const ctx = buildCtx(args);
  for (const probe of args.outcome.passed ? PROBES_PASS : PROBES_FAIL) {
    const d = probe(ctx);
    if (d) return d;
  }
  // Terminal fallback — should be unreachable because the last entry in each
  // list is itself a guaranteed-hit fallback, but typed safely just in case.
  return makeFallback(ctx);
}

function buildCtx(args: DiagnoseArgs): ProbeCtx {
  const finalPerNode = args.finalFrame?.perNode ?? {};
  const nodesById = new Map(args.diagram.nodes.map((n) => [n.id, n]));
  let totalDrops = 0;
  for (const snap of Object.values(finalPerNode)) totalDrops += snap.droppedTotal;
  return { ...args, finalPerNode, nodesById, totalDrops };
}

// ─────────────────────────── probe utilities ───────────────────────────

function labelFor(kind: ComponentKind): string {
  return COMPONENT_SPECS[kind].label;
}

function pct(n: number, d: number): string {
  if (!d) return "0%";
  return `${((n / d) * 100).toFixed(0)}%`;
}

function nodesOfKind(ctx: ProbeCtx, kind: ComponentKind): DiagramNode[] {
  return ctx.diagram.nodes.filter((n) => n.kind === kind);
}

function hasKind(ctx: ProbeCtx, kind: ComponentKind): boolean {
  return nodesOfKind(ctx, kind).length > 0;
}

/** Snapshot for a node id, or a zeroed default when the run produced no
 *  frames (degenerate case — should still let probes be safe). */
function snap(ctx: ProbeCtx, nodeId: string): NodeRuntimeSnapshot {
  return (
    ctx.finalPerNode[nodeId] ?? {
      inFlight: 0,
      peakInFlight: 0,
      utilization: 0,
      servedTotal: 0,
      droppedTotal: 0,
      servedThisTick: 0,
      droppedThisTick: 0,
      pendingDepth: 0,
      peakPendingDepth: 0,
    }
  );
}

/** Heaviest-dropping non-client node, if any drops happened. */
function topDropNode(ctx: ProbeCtx): { node: DiagramNode; drops: number } | null {
  let best: { node: DiagramNode; drops: number } | null = null;
  for (const node of ctx.diagram.nodes) {
    if (node.kind === "client") continue;
    const drops = snap(ctx, node.id).droppedTotal;
    if (drops > 0 && (!best || drops > best.drops)) {
      best = { node, drops };
    }
  }
  return best;
}

function buildEvidenceForMetrics(metrics: SimulationMetrics, sla: SLA): DiagnosisEvidence[] {
  return [
    { label: "Success rate", value: `${(metrics.successRate * 100).toFixed(1)}% (SLA ${(sla.minSuccessRate * 100).toFixed(0)}%)` },
    { label: "p95 latency", value: `${ticksToMs(metrics.p95Latency).toFixed(0)} ms (SLA ${ticksToMs(sla.maxP95Latency).toFixed(0)} ms)` },
  ];
}

function buildCopy(
  category: Diagnosis["category"],
  vars: Record<string, string | number>,
  culpritNodeIds: string[],
  evidence: DiagnosisEvidence[],
): Diagnosis {
  const tpl = DIAGNOSIS_COPY[category];
  return {
    category,
    headline: format(tpl.headline, vars),
    explanation: format(tpl.explanation, vars),
    culpritNodeIds,
    evidence,
    suggestions: tpl.suggestions.map((s) => format(s, vars)),
  };
}

// ─────────────────────────── individual probes ──────────────────────────

/** A scheduled failure was configured AND no replica group covers the target. */
const probeFailoverGap: Probe = (ctx) => {
  const failures = ctx.workload.failures ?? [];
  if (failures.length === 0) return null;
  for (const f of failures) {
    const matches = ctx.diagram.nodes.filter(
      (n) => n.kind === f.target.kind && (!f.target.role || n.role === f.target.role),
    );
    if (matches.length === 0) continue;
    const idx = f.target.index ?? 0;
    const picked = matches[idx];
    if (!picked) continue;
    // Replication coverage = at least one healthy sibling in the same group.
    const sameGroup = picked.replicaGroupId
      ? ctx.diagram.nodes.filter(
          (n) => n.replicaGroupId === picked.replicaGroupId && n.id !== picked.id,
        )
      : [];
    const replicaCovered = sameGroup.length > 0;
    if (replicaCovered) continue;

    const drops = snap(ctx, picked.id).droppedTotal;
    const kindLabel = labelFor(picked.kind);
    return buildCopy(
      "no_failover",
      { kind: kindLabel },
      [picked.id],
      [
        { label: "Failure window", value: `tick ${f.atTick}–${f.atTick + f.durationTicks}` },
        { label: `${kindLabel} drops`, value: `${drops}` },
        ...buildEvidenceForMetrics(ctx.outcome.metrics, ctx.sla),
      ],
    );
  }
  return null;
};

/** A failure was scheduled on a node downstream of a server, drops dominated
 *  at the server (not at the failed node), and no circuit breaker sits on
 *  the path. Indicates cascading failure without a backstop. */
const probeBreakerAbsent: Probe = (ctx) => {
  const failures = ctx.workload.failures ?? [];
  if (failures.length === 0) return null;
  if (hasKind(ctx, "circuit_breaker")) return null;

  // Find the failed node id (first failure that resolves).
  for (const f of failures) {
    const matches = ctx.diagram.nodes.filter(
      (n) => n.kind === f.target.kind && (!f.target.role || n.role === f.target.role),
    );
    const picked = matches[f.target.index ?? 0];
    if (!picked) continue;

    // Is there at least one server upstream of the failed node?
    const upstreamServers = ctx.diagram.edges
      .filter((e) => e.toNodeId === picked.id)
      .map((e) => ctx.nodesById.get(e.fromNodeId))
      .filter((n): n is DiagramNode => !!n && n.kind === "server");

    if (upstreamServers.length === 0) continue;

    const serverDrops = upstreamServers.reduce((s, n) => s + snap(ctx, n.id).droppedTotal, 0);
    const failedDrops = snap(ctx, picked.id).droppedTotal;
    // Cascade signal: upstream server lost more than the failed node itself.
    if (serverDrops <= failedDrops) continue;

    return buildCopy(
      "breaker_absent",
      { kind: labelFor(picked.kind) },
      [...upstreamServers.map((n) => n.id), picked.id],
      [
        { label: `${labelFor(picked.kind)} drops (root cause)`, value: `${failedDrops}` },
        { label: "Server drops (cascade)", value: `${serverDrops}` },
        ...buildEvidenceForMetrics(ctx.outcome.metrics, ctx.sla),
      ],
    );
  }
  return null;
};

/** A queue saturated its pending list and dropped at the queue. */
const probeQueueOverflow: Probe = (ctx) => {
  for (const node of nodesOfKind(ctx, "queue")) {
    const s = snap(ctx, node.id);
    const cfg = (node.config as { bufferSize?: number } | undefined) ?? {};
    // Match the simulator's hard cap (QUEUE_PENDING_MAX = 1000) when no
    // bufferSize is set, so the probe doesn't fire spuriously when the
    // default is large enough not to matter.
    const buffer = cfg.bufferSize ?? 1000;
    const saturated = s.peakPendingDepth >= Math.max(1, Math.floor(buffer * 0.95));
    if (!saturated) continue;
    if (s.droppedTotal === 0) continue;

    return buildCopy(
      "queue_overflow",
      { kind: "Queue" },
      [node.id],
      [
        { label: "Peak pending depth", value: `${s.peakPendingDepth} / ${buffer}` },
        { label: "Queue drops", value: `${s.droppedTotal}` },
        ...buildEvidenceForMetrics(ctx.outcome.metrics, ctx.sla),
      ],
    );
  }
  return null;
};

/** A rate limiter was the heaviest dropper — design working as intended,
 *  player needs to understand the tradeoff. */
const probeRateLimiterPressure: Probe = (ctx) => {
  const top = topDropNode(ctx);
  if (!top) return null;
  if (top.node.kind !== "rate_limiter") return null;
  if (ctx.totalDrops === 0) return null;
  if (top.drops / ctx.totalDrops < 0.5) return null;

  // Name the protected downstream kind, if we can find it.
  const downstreamEdge = ctx.diagram.edges.find((e) => e.fromNodeId === top.node.id);
  const downstreamNode = downstreamEdge ? ctx.nodesById.get(downstreamEdge.toNodeId) : undefined;
  const protectedKind = downstreamNode ? labelFor(downstreamNode.kind) : "downstream";

  return buildCopy(
    "rate_limit_pressure",
    { kind: protectedKind },
    [top.node.id],
    [
      { label: "Limiter drops", value: `${top.drops} (${pct(top.drops, ctx.totalDrops)} of all drops)` },
      ...buildEvidenceForMetrics(ctx.outcome.metrics, ctx.sla),
    ],
  );
};

/** A non-client node ran out of capacity and dominated drops. */
const probeNodeOverloaded: Probe = (ctx) => {
  const top = topDropNode(ctx);
  if (!top) return null;
  if (ctx.totalDrops === 0) return null;
  if (top.drops / ctx.totalDrops < 0.6) return null;
  const cap = COMPONENT_SPECS[top.node.kind].capacity;
  if (!isFinite(cap)) return null;
  const s = snap(ctx, top.node.id);
  if (s.peakInFlight < cap * 0.95) return null;

  return buildCopy(
    "node_overloaded",
    { kind: labelFor(top.node.kind) },
    [top.node.id],
    [
      { label: `Peak in-flight`, value: `${s.peakInFlight} / ${cap}` },
      { label: `Drops at ${labelFor(top.node.kind)}`, value: `${top.drops} (${pct(top.drops, ctx.totalDrops)} of all drops)` },
      ...buildEvidenceForMetrics(ctx.outcome.metrics, ctx.sla),
    ],
  );
};

/** Success rate met SLA but p95 latency didn't, and no node was overloaded. */
const probeLatencyPathTooLong: Probe = (ctx) => {
  const m = ctx.outcome.metrics;
  if (m.successRate < ctx.sla.minSuccessRate) return null;
  if (m.p95Latency <= ctx.sla.maxP95Latency) return null;
  return buildCopy(
    "latency_path_too_long",
    {},
    m.bottleneckNodeId ? [m.bottleneckNodeId] : [],
    [
      { label: "p95 latency", value: `${ticksToMs(m.p95Latency).toFixed(0)} ms (SLA ${ticksToMs(ctx.sla.maxP95Latency).toFixed(0)} ms)` },
      { label: "Avg latency", value: `${ticksToMs(m.avgLatency).toFixed(0)} ms` },
      { label: "Success rate", value: `${(m.successRate * 100).toFixed(1)}%` },
    ],
  );
};

/** A cache exists but the bottleneck is a non-cache node downstream of one. */
const probeCacheUnderused: Probe = (ctx) => {
  if (!hasKind(ctx, "cache")) return null;
  const m = ctx.outcome.metrics;
  if (!m.bottleneckNodeId) return null;
  const bottleneck = ctx.nodesById.get(m.bottleneckNodeId);
  if (!bottleneck) return null;
  if (bottleneck.kind === "cache") return null;
  // Is the bottleneck reachable from at least one cache (cache → ... → bn)?
  const downstreamOfCache = isDownstreamOf(ctx, bottleneck.id, "cache");
  if (!downstreamOfCache) return null;
  const s = snap(ctx, bottleneck.id);

  return buildCopy(
    "cache_underused",
    { kind: labelFor(bottleneck.kind) },
    [bottleneck.id],
    [
      { label: "Bottleneck node", value: labelFor(bottleneck.kind) },
      { label: "Drops at bottleneck", value: `${s.droppedTotal}` },
      ...buildEvidenceForMetrics(m, ctx.sla),
    ],
  );
};

/** PASS only: bottleneck node spent run >= 85% utilised at peak. */
const probeHeadroomThin: Probe = (ctx) => {
  const m = ctx.outcome.metrics;
  if (!m.bottleneckNodeId) return null;
  const node = ctx.nodesById.get(m.bottleneckNodeId);
  if (!node) return null;
  const cap = COMPONENT_SPECS[node.kind].capacity;
  if (!isFinite(cap)) return null;
  const s = snap(ctx, m.bottleneckNodeId);
  if (s.peakInFlight / cap < 0.85) return null;

  return buildCopy(
    "headroom_thin",
    { kind: labelFor(node.kind) },
    [node.id],
    [
      { label: `Peak ${labelFor(node.kind)} in-flight`, value: `${s.peakInFlight} / ${cap} (${((s.peakInFlight / cap) * 100).toFixed(0)}%)` },
      ...buildEvidenceForMetrics(m, ctx.sla),
    ],
  );
};

/** PASS terminal fallback. */
const probePassedClean: Probe = (ctx) => buildCopy(
  "passed_clean",
  {},
  ctx.outcome.metrics.bottleneckNodeId ? [ctx.outcome.metrics.bottleneckNodeId] : [],
  buildEvidenceForMetrics(ctx.outcome.metrics, ctx.sla),
);

// ─────────────────────────── helpers ───────────────────────────────────

/** Does any path of length >= 1 from a node of `ancestorKind` reach `nodeId`? */
function isDownstreamOf(ctx: ProbeCtx, nodeId: string, ancestorKind: ComponentKind): boolean {
  const adj = new Map<string, string[]>();
  for (const e of ctx.diagram.edges) {
    const list = adj.get(e.fromNodeId) ?? [];
    list.push(e.toNodeId);
    adj.set(e.fromNodeId, list);
  }
  const seeds = ctx.diagram.nodes.filter((n) => n.kind === ancestorKind).map((n) => n.id);
  const seen = new Set<string>();
  const stack = [...seeds];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const nxt of adj.get(cur) ?? []) {
      if (nxt === nodeId) return true;
      if (seen.has(nxt)) continue;
      seen.add(nxt);
      stack.push(nxt);
    }
  }
  return false;
}

function makeFallback(ctx: ProbeCtx): Diagnosis {
  return buildCopy(
    ctx.outcome.passed ? "passed_clean" : "node_overloaded",
    { kind: "system" },
    ctx.outcome.metrics.bottleneckNodeId ? [ctx.outcome.metrics.bottleneckNodeId] : [],
    buildEvidenceForMetrics(ctx.outcome.metrics, ctx.sla),
  );
}

// ─────────────────────────── cascades ──────────────────────────────────

const PROBES_FAIL: Probe[] = [
  probeFailoverGap,
  probeBreakerAbsent,
  probeQueueOverflow,
  probeRateLimiterPressure,
  probeNodeOverloaded,
  probeLatencyPathTooLong,
  probeCacheUnderused,
  // Terminal: a generic "something dropped" fallback when nothing more
  // specific matched but the run failed.
  (ctx) => makeFallback(ctx),
];

const PROBES_PASS: Probe[] = [
  probeHeadroomThin,
  probePassedClean,
];

/**
 * Build a minimal Diagnosis for the early-exit "no client" / structural
 * failure case, where there are no frames and no real run to inspect.
 */
export function diagnoseEmpty(headline: string, explanation?: string): Diagnosis {
  return {
    category: "node_overloaded",
    headline,
    explanation:
      explanation ??
      "The simulation didn't start because the diagram is missing a required component. Fix the structural issue and run again.",
    culpritNodeIds: [],
    evidence: [],
    suggestions: ["Make sure your diagram has at least one client to originate traffic."],
  };
}
