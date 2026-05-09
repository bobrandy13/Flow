import type { Diagram, DiagramEdge, DiagramNode } from "../types/diagram";
import type { ComponentKind, FanOutPolicy } from "../types/components";
import type {
  EdgeTransition,
  NodeRuntimeSnapshot,
  SimulationMetrics,
  SimulationOutcome,
  TickFrame,
} from "../types/validation";
import type { SLA, Workload } from "../types/level";
import { COMPONENT_SPECS, DEFAULT_FAN_OUT } from "../engine/component-specs";

/** Deterministic mulberry32 RNG. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SimulationInput {
  diagram: Diagram;
  workload: Workload;
  sla: SLA;
  seed: number;
}

interface NodeRuntime {
  node: DiagramNode;
  inFlight: number;
  peakInFlight: number;
  totalServed: number;
  totalDropped: number;
  servedThisTick: number;
  droppedThisTick: number;
  /** Queue-only: items waiting to be forwarded to a consumer downstream. */
  pending: DeferredQueueItem[];
  peakPendingDepth: number;
  /** Set true when a scheduled failure window covers the current tick.
   *  Failed nodes refuse new admissions and (Stage 3) drop in-flight work. */
  isFailed?: boolean;
}

interface DeferredQueueItem {
  enqueuedTick: number;
}

interface InFlightRequest {
  id: number;
  nodeId: string;
  arriveTick: number;
  releaseTick: number;
  /** Forward path the request has taken so far (origin client at index 0,
   *  current node at last index). On return, we walk this in reverse. */
  path: string[];
  /** "forward" = extending the path outward; "return" = walking back home. */
  direction: "forward" | "return";
  /** Tick when this request originally entered the system. */
  startTick: number;
  /** True for fire-and-forget work spawned by a queue draining its pending
   *  list. Producer was already ACK'd at queue ingress, so these requests
   *  must NOT walk back home and must NOT be counted as completed again. */
  asyncOrigin: boolean;
}

interface CompletedRequest {
  startTick: number;
  endTick: number;
  succeeded: boolean;
}

/** Hard ceiling on a queue's pending list. Beyond this, new arrivals are
 *  rejected at the producer (no ACK → counted as failures by the producer).
 *  Exported for tests and future visualisation hooks; consumed by Stage 3
 *  async-queue logic in `simulateStream()`. */
export const QUEUE_PENDING_MAX = 1000;

/**
 * Streaming variant of `simulate()`. Yields one `TickFrame` per simulated
 * tick (steady + drain phases), then returns the final `SimulationOutcome`.
 *
 * `simulate()` is a thin wrapper that drains this generator. The streaming
 * form powers the live UI (per-node badges, utilization tinting, drop pulses).
 */
export function* simulateStream(
  input: SimulationInput,
): Generator<TickFrame, SimulationOutcome, void> {
  const { diagram, workload, sla, seed } = input;
  const rng = mulberry32(seed);

  const clients = diagram.nodes.filter((n) => n.kind === "client");
  if (clients.length === 0) {
    return failed("No client present — nowhere to originate traffic.");
  }

  const runtimes = new Map<string, NodeRuntime>();
  for (const node of diagram.nodes) {
    runtimes.set(node.id, {
      node,
      inFlight: 0,
      peakInFlight: 0,
      totalServed: 0,
      totalDropped: 0,
      servedThisTick: 0,
      droppedThisTick: 0,
      pending: [],
      peakPendingDepth: 0,
    });
  }

  const successors = buildSuccessors(diagram);
  const edgeByPair = new Map<string, DiagramEdge>();
  for (const e of diagram.edges) edgeByPair.set(`${e.fromNodeId}->${e.toNodeId}`, e);

  // Replica groups: replicaGroupId → list of node ids that share the group.
  // Used to spread admissions across all healthy members of the group.
  const replicaGroupMembers = new Map<string, string[]>();
  for (const node of diagram.nodes) {
    if (!node.replicaGroupId) continue;
    const list = replicaGroupMembers.get(node.replicaGroupId) ?? [];
    list.push(node.id);
    replicaGroupMembers.set(node.replicaGroupId, list);
  }
  function componentSpec(kind: ComponentKind) {
    return COMPONENT_SPECS[kind];
  }
  /** If `targetId` is part of a replica group, redirect to the least-loaded
   *  healthy member (skipping path-blocked ones); else return targetId as-is. */
  function resolveReplicaTarget(targetId: string, path: ReadonlyArray<string>): string | null {
    const targetRt = runtimes.get(targetId);
    if (!targetRt) return targetId;
    const groupId = targetRt.node.replicaGroupId;
    if (!groupId) return targetId;
    const members = replicaGroupMembers.get(groupId);
    if (!members || members.length <= 1) return targetId;
    let best: string | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const id of members) {
      if (path.includes(id)) continue;
      const rt = runtimes.get(id);
      if (!rt) continue;
      if (rt.isFailed) continue;
      const cap = componentSpec(rt.node.kind).capacity;
      const score = cap > 0 ? rt.inFlight / cap : rt.inFlight;
      if (score < bestScore) {
        bestScore = score;
        best = id;
      }
    }
    return best;
  }

  // Round-robin cursors per node id.
  const rrCursor = new Map<string, number>();

  const inFlight: InFlightRequest[] = [];
  const completed: CompletedRequest[] = [];
  let nextRequestId = 1;

  const perClientPerTick = Math.max(1, Math.round(workload.requestsPerTick / clients.length));

  // Run the full workload, then keep ticking (no new injections) until all
  // in-flight requests have either completed or we hit a generous safety cap.
  // Without this drain phase, the tail of requests injected in the last few
  // ticks would be force-dropped and wreck the success rate.
  const maxTicks = workload.ticks * 4 + 200;
  for (let tick = 0; tick < maxTicks; tick++) {
    const injecting = tick < workload.ticks;
    if (!injecting && inFlight.length === 0 && !hasPendingWork(runtimes)) break;

    // reset per-tick counters
    for (const rt of runtimes.values()) {
      rt.servedThisTick = 0;
      rt.droppedThisTick = 0;
    }
    const transitionsThisTick: EdgeTransition[] = [];

    // 1. Inject requests from each client into a downstream node.
    if (injecting) {
      const burstMultiplier = computeBurstMultiplier(workload.bursts, tick);
      const effectivePerClient = Math.max(
        1,
        Math.round(perClientPerTick * burstMultiplier),
      );
      for (const client of clients) {
        for (let i = 0; i < effectivePerClient; i++) {
          const next = pickNextNotInPath(client.id, [client.id], successors, rrCursor, rng, "round_robin");
          if (!next) continue; // disconnected client, request never enters system.
          recordTransition(client.id, next, "forward", transitionsThisTick);
          admit(next, tick, [client.id, next], "forward", tick);
        }
      }
    }

    // 2. Release requests whose service time elapsed at the current tick.
    for (let i = inFlight.length - 1; i >= 0; i--) {
      const req = inFlight[i];
      if (req.releaseTick > tick) continue;
      const rt = runtimes.get(req.nodeId)!;
      rt.inFlight = Math.max(0, rt.inFlight - 1);
      rt.totalServed += 1;
      rt.servedThisTick += 1;
      inFlight.splice(i, 1);

      const node = rt.node;

      // RETURN direction: walk back along path one step.
      if (req.direction === "return") {
        // Reached the origin client → request fully succeeded.
        if (node.kind === "client" && req.path.length === 1) {
          completed.push({ startTick: req.startTick, endTick: tick, succeeded: true });
          continue;
        }
        // Pop one node off the path and admit at its predecessor.
        if (req.path.length < 2) {
          // Should be unreachable, but guard against malformed state.
          completed.push({ startTick: req.startTick, endTick: tick, succeeded: false });
          continue;
        }
        const prev = req.path[req.path.length - 2];
        const newPath = req.path.slice(0, -1);
        recordTransition(node.id, prev, "return", transitionsThisTick);
        admit(prev, tick, newPath, "return", req.startTick);
        continue;
      }

      // FORWARD direction.
      // Cache hit short-circuits to return (no further forward exploration).
      let turnAround = false;
      if (node.kind === "cache" && !req.asyncOrigin) {
        const incomingEdge = findIncomingEdge(diagram, node.id);
        const hitRate = incomingEdge?.cacheHitRate ?? 0.8;
        if (rng() < hitRate) turnAround = true;
      }

      if (!turnAround) {
        // Try to forward to a successor not already on this request's path.
        // Both load_balancer and shard read their fan-out policy from config;
        // shard defaults to consistent_hash so requests with the same id
        // always land on the same downstream.
        let policy: FanOutPolicy = "round_robin";
        if (node.kind === "load_balancer") {
          policy = (node.config as { fanOut?: FanOutPolicy } | undefined)?.fanOut ?? DEFAULT_FAN_OUT;
        } else if (node.kind === "shard") {
          policy = (node.config as { fanOut?: FanOutPolicy } | undefined)?.fanOut ?? "consistent_hash";
        }
        const picked = pickNextNotInPath(node.id, req.path, successors, rrCursor, rng, policy, runtimes, req.id);
        // If the picked node is part of a replica group, redirect to the
        // least-loaded healthy member of that group (aggregating capacity).
        const next = picked ? resolveReplicaTarget(picked, req.path) : null;
        if (next) {
          const nextRt = runtimes.get(next)!;

          // ----- Async producer-consumer queue (Option C) -----
          // If `next` is a queue AND this request is NOT itself async-origin
          // work being drained, the queue ACKs immediately and the response
          // turns around at `node` (the producer). The actual work continues
          // asynchronously via the per-tick drain step below.
          if (nextRt.node.kind === "queue" && !req.asyncOrigin) {
            recordTransition(node.id, next, "forward", transitionsThisTick);
            if (nextRt.pending.length >= QUEUE_PENDING_MAX) {
              // Pending overflow → producer sees a drop (no ACK). Counted
              // on the queue node so the bottleneck explainer fingers it.
              nextRt.totalDropped += 1;
              nextRt.droppedThisTick += 1;
              completed.push({ startTick: req.startTick, endTick: tick, succeeded: false });
              continue;
            }
            nextRt.pending.push({ enqueuedTick: tick });
            if (nextRt.pending.length > nextRt.peakPendingDepth) {
              nextRt.peakPendingDepth = nextRt.pending.length;
            }
            // Visual: immediate ACK back to producer.
            recordTransition(next, node.id, "return", transitionsThisTick);
            // Begin the response journey from the producer back to the client.
            if (req.path.length < 2) {
              // Edge case: client → queue directly. ACK is the whole round-trip.
              completed.push({ startTick: req.startTick, endTick: tick, succeeded: true });
              continue;
            }
            const prev = req.path[req.path.length - 2];
            const newPath = req.path.slice(0, -1);
            recordTransition(node.id, prev, "return", transitionsThisTick);
            admit(prev, tick, newPath, "return", req.startTick);
            continue;
          }

          recordTransition(node.id, next, "forward", transitionsThisTick);
          admit(next, tick, [...req.path, next], "forward", req.startTick, req.asyncOrigin);
          continue;
        }
        // Dead end → start the return journey.
        turnAround = true;
      }

      // Async-origin work that dead-ends (or cache-hit short-circuits) just
      // terminates silently. Producer was already ACK'd; no further accounting.
      if (req.asyncOrigin) continue;

      // Turn around: begin returning back along the path the request came in on.
      if (req.path.length < 2) {
        // Origin client only — nowhere to return to. Drop.
        completed.push({ startTick: req.startTick, endTick: tick, succeeded: false });
        continue;
      }
      const prev = req.path[req.path.length - 2];
      const newPath = req.path.slice(0, -1);
      recordTransition(node.id, prev, "return", transitionsThisTick);
      admit(prev, tick, newPath, "return", req.startTick);
    }

    // 2.5 Queue drain: each queue tries to push pending items to consumers
    //     with free capacity. Items move as `asyncOrigin=true` work and never
    //     walk back home — the producer was ACK'd at queue ingress.
    for (const rt of runtimes.values()) {
      if (rt.node.kind !== "queue") continue;
      if (rt.pending.length === 0) continue;
      const consumers = successors.get(rt.node.id) ?? [];
      if (consumers.length === 0) continue;
      // Drain as many items as we can this tick, bounded by consumer capacity.
      // Stop on the first attempt that fails to find a consumer with room.
      let safety = rt.pending.length;
      while (rt.pending.length > 0 && safety-- > 0) {
        const consumerId = pickNextNotInPath(
          rt.node.id,
          [rt.node.id],
          successors,
          rrCursor,
          rng,
          "round_robin",
        );
        if (!consumerId) break;
        const crt = runtimes.get(consumerId)!;
        const cap = COMPONENT_SPECS[crt.node.kind].capacity;
        if (crt.inFlight >= cap) break;
        rt.pending.shift();
        recordTransition(rt.node.id, consumerId, "forward", transitionsThisTick);
        admit(consumerId, tick, [rt.node.id, consumerId], "forward", tick, true);
      }
    }

    // 3. Yield a frame for this tick.
    yield {
      tick,
      phase: injecting ? "steady" : "drain",
      perNode: snapshotRuntimes(runtimes),
      transitions: transitionsThisTick,
      metricsSoFar: computeMetrics(completed, runtimes),
    };
  }

  // Anything still in flight after the safety cap is a real failure (loop,
  // overload that never drained, etc.).
  for (const req of inFlight) {
    completed.push({ startTick: req.startTick, endTick: maxTicks, succeeded: false });
  }

  const metrics = computeMetrics(completed, runtimes);
  const passed = metrics.successRate >= sla.minSuccessRate && metrics.p95Latency <= sla.maxP95Latency;
  return {
    passed,
    metrics,
    failureReason: passed
      ? undefined
      : metrics.successRate < sla.minSuccessRate
        ? `Success rate ${(metrics.successRate * 100).toFixed(1)}% < required ${(sla.minSuccessRate * 100).toFixed(0)}%.`
        : `p95 latency ${metrics.p95Latency.toFixed(1)} > allowed ${sla.maxP95Latency}.`,
  };

  // ----- helpers (closures over local state) -----

  function recordTransition(
    fromId: string,
    toId: string,
    direction: "forward" | "return",
    sink: EdgeTransition[],
  ) {
    // For forward hops the diagram has a fromId→toId edge. For return hops we
    // walk the SAME edge in reverse, so look up toId→fromId. (Both directions
    // share one logical channel — players don't draw separate return edges.)
    const directEdge = edgeByPair.get(`${fromId}->${toId}`);
    const reverseEdge = edgeByPair.get(`${toId}->${fromId}`);
    const edge = directEdge ?? reverseEdge;
    sink.push({
      edgeId: edge?.id ?? `synthetic:${fromId}->${toId}`,
      fromNodeId: fromId,
      toNodeId: toId,
      direction,
    });
  }

  function admit(
    nodeId: string,
    nowTick: number,
    path: string[],
    direction: "forward" | "return",
    startTick: number,
    asyncOrigin = false,
  ) {
    const rt = runtimes.get(nodeId);
    if (!rt) return;
    const cap = rt.node.kind === "client"
      ? Number.POSITIVE_INFINITY
      : COMPONENT_SPECS[rt.node.kind].capacity;
    if (rt.inFlight >= cap) {
      rt.totalDropped += 1;
      rt.droppedThisTick += 1;
      // Async-origin overload doesn't add to user-visible failures (producer
      // was already ACK'd). It is still counted on the node for diagnostics.
      if (!asyncOrigin) {
        completed.push({ startTick, endTick: nowTick, succeeded: false });
      }
      return;
    }
    rt.inFlight += 1;
    if (rt.inFlight > rt.peakInFlight) rt.peakInFlight = rt.inFlight;
    const spec = COMPONENT_SPECS[rt.node.kind];
    const jitter = spec.jitter > 0 ? 1 + (rng() * 2 - 1) * spec.jitter : 1;
    const dwell = Math.max(0, Math.round(spec.baseLatency * jitter));
    inFlight.push({
      id: nextRequestId++,
      nodeId,
      arriveTick: nowTick,
      releaseTick: nowTick + dwell,
      path,
      direction,
      startTick,
      asyncOrigin,
    });
  }
}

/**
 * Run a discrete-tick simulation to completion and return the final outcome.
 * Thin wrapper over `simulateStream()` — preserves all batch-mode behaviour.
 */
export function simulate(input: SimulationInput): SimulationOutcome {
  const stream = simulateStream(input);
  let result = stream.next();
  while (!result.done) result = stream.next();
  return result.value;
}

function snapshotRuntimes(runtimes: Map<string, NodeRuntime>): Record<string, NodeRuntimeSnapshot> {
  const out: Record<string, NodeRuntimeSnapshot> = {};
  for (const [id, rt] of runtimes) {
    const cap = rt.node.kind === "client"
      ? Number.POSITIVE_INFINITY
      : COMPONENT_SPECS[rt.node.kind].capacity;
    out[id] = {
      inFlight: rt.inFlight,
      peakInFlight: rt.peakInFlight,
      utilization: isFinite(cap) && cap > 0 ? Math.min(1, rt.inFlight / cap) : 0,
      servedTotal: rt.totalServed,
      droppedTotal: rt.totalDropped,
      servedThisTick: rt.servedThisTick,
      droppedThisTick: rt.droppedThisTick,
      pendingDepth: rt.pending.length,
      peakPendingDepth: rt.peakPendingDepth,
    };
  }
  return out;
}

function failed(reason: string): SimulationOutcome {
  return {
    passed: false,
    metrics: { avgLatency: 0, p95Latency: 0, successRate: 0, drops: 0 },
    failureReason: reason,
  };
}

function hasPendingWork(runtimes: Map<string, NodeRuntime>): boolean {
  for (const rt of runtimes.values()) {
    if (rt.pending.length > 0) return true;
  }
  return false;
}

/**
 * Multiply the per-tick injection rate by the product of all burst windows
 * active at this tick. Returns 1 when no bursts are configured or active.
 */
function computeBurstMultiplier(
  bursts: Workload["bursts"],
  tick: number,
): number {
  if (!bursts || bursts.length === 0) return 1;
  let mult = 1;
  for (const b of bursts) {
    if (tick >= b.atTick && tick < b.atTick + b.durationTicks) {
      mult *= b.multiplier;
    }
  }
  return mult;
}

function buildSuccessors(diagram: Diagram): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const n of diagram.nodes) m.set(n.id, []);
  for (const e of diagram.edges) {
    if (!m.has(e.fromNodeId)) m.set(e.fromNodeId, []);
    m.get(e.fromNodeId)!.push(e.toNodeId);
  }
  return m;
}

function findIncomingEdge(diagram: Diagram, nodeId: string): DiagramEdge | undefined {
  return diagram.edges.find((e) => e.toNodeId === nodeId);
}

/**
 * Pick the next forward hop from `fromId`, filtering out any successor that
 * is already on the request's path.
 * Prevents requests from re-entering nodes they came through (which would
 * either loop forever or trip the path-walking return logic incorrectly).
 */
function pickNextNotInPath(
  fromId: string,
  path: string[],
  successors: Map<string, string[]>,
  rrCursor: Map<string, number>,
  rng: () => number,
  policy: FanOutPolicy,
  runtimes?: Map<string, NodeRuntime>,
  requestId?: number,
): string | undefined {
  const all = successors.get(fromId) ?? [];
  const pathSet = new Set(path);
  const outs = all.filter((id) => !pathSet.has(id));
  if (outs.length === 0) return undefined;
  if (outs.length === 1) return outs[0];
  if (policy === "random") return outs[Math.floor(rng() * outs.length)];
  if (policy === "least_loaded" && runtimes) {
    let best = outs[0];
    let bestLoad = runtimes.get(best)?.inFlight ?? 0;
    for (let i = 1; i < outs.length; i++) {
      const load = runtimes.get(outs[i])?.inFlight ?? 0;
      if (load < bestLoad) { best = outs[i]; bestLoad = load; }
    }
    return best;
  }
  if (policy === "consistent_hash" && requestId !== undefined) {
    // Deterministic per-request routing: same requestId always hashes to the
    // same bucket. Hash the full set of original successors (not the
    // path-filtered list) so a request consistently maps to the same shard
    // regardless of which other successors happen to be path-blocked at this
    // node — then if that bucket is filtered out, fall through to round_robin
    // among what's left (rare in practice; only happens on multi-hop loops).
    const stableBucket = hash32(requestId) % all.length;
    const target = all[stableBucket];
    if (!pathSet.has(target)) return target;
    // Fall through to round_robin on the filtered set.
  }
  // round_robin (default) — cursor scoped to the filtered list so behaviour
  // is stable regardless of which successors happen to be in-path.
  const cursorKey = `${fromId}|${outs.join(",")}`;
  const idx = (rrCursor.get(cursorKey) ?? 0) % outs.length;
  rrCursor.set(cursorKey, idx + 1);
  return outs[idx];
}

/** Fast 32-bit integer hash. xmur3-flavoured; deterministic, no allocations. */
function hash32(n: number): number {
  let h = n | 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h = (h ^ (h >>> 16)) >>> 0;
  return h;
}

function computeMetrics(
  completed: CompletedRequest[],
  runtimes: Map<string, NodeRuntime>,
): SimulationMetrics {
  const succ = completed.filter((c) => c.succeeded);
  const latencies = succ.map((c) => c.endTick - c.startTick).sort((a, b) => a - b);
  const avg = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const p95 = latencies.length ? latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))] : 0;
  const total = completed.length || 1;
  const drops = completed.filter((c) => !c.succeeded).length;

  let bottleneckNodeId: string | undefined;
  let bottleneckRatio = 0;
  for (const rt of runtimes.values()) {
    const cap = COMPONENT_SPECS[rt.node.kind as ComponentKind].capacity;
    if (!isFinite(cap)) continue;
    const ratio = rt.peakInFlight / cap;
    if (ratio > bottleneckRatio) {
      bottleneckRatio = ratio;
      bottleneckNodeId = rt.node.id;
    }
  }

  return {
    avgLatency: Number(avg.toFixed(2)),
    p95Latency: Number(p95.toFixed(2)),
    successRate: Number((succ.length / total).toFixed(4)),
    drops,
    bottleneckNodeId,
  };
}
