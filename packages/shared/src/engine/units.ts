import type { ComponentKind, ComponentSpec } from "../types/components";

/**
 * Single source of truth for converting simulation ticks → real-world units.
 * 1 tick = 10 ms. All UI surfaces should display ms by default and use ticks
 * only as the secondary unit (e.g. tooltips).
 */
export const MS_PER_TICK = 10;

export function ticksToMs(ticks: number): number {
  return ticks * MS_PER_TICK;
}

export function msToTicks(ms: number): number {
  return ms / MS_PER_TICK;
}

/**
 * Sustained throughput of a component, derived from queueing theory:
 *   throughput = capacity (concurrent slots) / service time (per request)
 *
 * Returns requests per second.
 */
export function throughputPerSecond(spec: Pick<ComponentSpec, "baseLatency" | "capacity">): number {
  if (!isFinite(spec.capacity)) return Infinity;
  if (spec.baseLatency <= 0) return Infinity;
  const serviceMs = ticksToMs(spec.baseLatency);
  return (spec.capacity / serviceMs) * 1000;
}

export function formatLatency(ticks: number): { primary: string; secondary: string } {
  return {
    primary: `${ticksToMs(ticks)} ms`,
    secondary: `≈ ${ticks} tick${ticks === 1 ? "" : "s"}`,
  };
}

export function formatCapacity(spec: Pick<ComponentSpec, "baseLatency" | "capacity">): {
  primary: string;
  secondary: string;
} {
  if (!isFinite(spec.capacity)) {
    return { primary: "unbounded", secondary: "no concurrency limit" };
  }
  const tps = throughputPerSecond(spec);
  return {
    primary: `${spec.capacity} concurrent`,
    secondary: `≈ ${tps.toFixed(0)} req/s sustained`,
  };
}

export function formatSuccessRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Plain-English explanations of each component kind. Aimed at someone who
 * has never built a system before. Keep one paragraph max; add the analogy
 * line second so it can be styled differently.
 */
export interface KindExplainer {
  one_liner: string;
  what_it_does: string;
  analogy: string;
}

export const KIND_EXPLAINERS: Record<ComponentKind, KindExplainer> = {
  client: {
    one_liner: "Where requests come from.",
    what_it_does:
      "A client represents the users (or other systems) hitting your service. In Flow, every tick each client fires off a batch of requests into the system.",
    analogy: "Think: people pressing 'Send' in an app.",
  },
  server: {
    one_liner: "Processes requests.",
    what_it_does:
      "A server takes in a request, does work for a few milliseconds, then hands it off (to a database, cache, or back to the client). It can only handle so many requests at the same time — its capacity.",
    analogy: "Think: a barista. Fast, but only one drink per hand at a time.",
  },
  database: {
    one_liner: "Stores data durably.",
    what_it_does:
      "A database persists data so it survives restarts. Reads and writes take longer than in-memory work, and databases handle fewer concurrent requests than servers, which makes them a common bottleneck.",
    analogy: "Think: a filing cabinet. Reliable, but slower than your desk drawer.",
  },
  cache: {
    one_liner: "Remembers recent results.",
    what_it_does:
      "A cache sits in front of slower storage and answers repeated requests instantly. Each cache edge has a hit rate — the fraction of requests served from memory without going to the database.",
    analogy: "Think: keeping the most-used files on your desk instead of in the cabinet.",
  },
  load_balancer: {
    one_liner: "Spreads traffic across servers.",
    what_it_does:
      "A load balancer accepts incoming requests and forwards each to one of several downstream servers. Its fan-out policy decides which server to pick (round-robin, random, or least-loaded).",
    analogy: "Think: the host at a restaurant deciding which waiter takes the next table.",
  },
  queue: {
    one_liner: "Decouples producers from consumers.",
    what_it_does:
      "A queue accepts messages from a producer and acknowledges them instantly — the producer doesn't wait for the consumer to do the work. The consumer pulls messages from the queue at its own pace. This lets a fast producer absorb bursts without overwhelming a slower consumer; the trade-off is eventual consistency (the producer doesn't know if the work succeeded).",
    analogy: "Think: a kitchen ticket rail. Waiters drop orders on the rail and walk away; cooks pull tickets when they're free.",
  },
  shard: {
    one_liner: "Routes by key so each piece of data lives on one downstream.",
    what_it_does:
      "A shard router splits traffic deterministically: the same request id always lands on the same downstream. This lets you scale past a single database's limits — each shard owns a slice of the keyspace and runs at its own capacity. Trade-off: queries that span shards need a separate aggregation step.",
    analogy: "Think: assigning library books by author surname. A–F to one shelf, G–M to another. Anyone searching always knows which shelf to check.",
  },
  rate_limiter: {
    one_liner: "Caps how fast traffic can flow downstream.",
    what_it_does:
      "A rate limiter uses a token bucket: tokens refill at a fixed rate, each request consumes one, and arrivals with no token are dropped. This protects a fragile downstream from being overwhelmed during bursts and forces backpressure on the producer.",
    analogy: "Think: a turnstile that only lets a fixed number of people through per minute.",
  },
  circuit_breaker: {
    one_liner: "Fails fast when a downstream is broken.",
    what_it_does:
      "A circuit breaker watches the recent error rate to its downstream. If the rate climbs above a threshold, the breaker 'opens' and rejects new requests immediately instead of waiting for them to time out. After a cooldown it half-opens, sends a probe, and either closes (recovered) or stays open (still broken).",
    analogy: "Think: an electrical breaker that trips when the line is overloaded — better to disconnect than to burn the house down.",
  },
};

/** Short explanations for the simulation result metrics. */
export const METRIC_EXPLAINERS: Record<string, string> = {
  successRate:
    "Percentage of requests that completed successfully (returned to a client) before being dropped or stranded. Higher is better.",
  avgLatency:
    "Average end-to-end time a successful request spent in the system, from the moment a client sent it to the moment a response came back.",
  p95Latency:
    "95th percentile latency: 95% of successful requests were faster than this. A small number of slow requests don't hide here — this is the experience of the worst-served users.",
  drops:
    "Total number of requests that failed: dropped due to capacity overflow, lost in a loop, or never delivered before time ran out.",
  bottleneck:
    "The component that was closest to (or over) its capacity. This is usually where to focus your next change — adding a cache in front of it, scaling it out, or rerouting traffic.",
};
