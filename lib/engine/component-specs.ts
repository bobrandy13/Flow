import type { ComponentKind, ComponentSpec, FanOutPolicy } from "@/types/components";

/** Visual + simulation defaults for each component kind. Single source of truth. */
export const COMPONENT_SPECS: Record<ComponentKind, ComponentSpec & { color: string; emoji: string }> = {
  client: {
    kind: "client",
    label: "Client",
    baseLatency: 0,
    jitter: 0,
    capacity: Number.POSITIVE_INFINITY,
    color: "#60a5fa",
    emoji: "👤",
  },
  server: {
    kind: "server",
    label: "Server",
    baseLatency: 3,
    jitter: 0.2,
    capacity: 80,
    color: "#34d399",
    emoji: "🖥️",
  },
  database: {
    kind: "database",
    label: "Database",
    baseLatency: 4,
    jitter: 0.15,
    capacity: 120,
    color: "#f472b6",
    emoji: "🗄️",
  },
  cache: {
    kind: "cache",
    label: "Cache",
    baseLatency: 1,
    jitter: 0.1,
    capacity: 200,
    color: "#fbbf24",
    emoji: "⚡",
  },
  load_balancer: {
    kind: "load_balancer",
    label: "Load Balancer",
    baseLatency: 1,
    jitter: 0.05,
    capacity: 500,
    color: "#a78bfa",
    emoji: "⚖️",
  },
  queue: {
    kind: "queue",
    label: "Queue",
    // Time spent inside the queue node itself for the immediate ACK roundtrip.
    // Real queue work (forwarding pending messages to the consumer) happens
    // separately and isn't bounded by this latency.
    baseLatency: 1,
    jitter: 0.05,
    // High concurrency for the brief ACK roundtrip; the *pending depth*
    // (messages waiting to be consumed) is tracked separately by the simulator.
    capacity: 200,
    color: "#fb923c",
    emoji: "📬",
  },
  shard: {
    kind: "shard",
    label: "Shard Router",
    baseLatency: 1,
    jitter: 0.05,
    capacity: 400,
    color: "#06b6d4",
    emoji: "🔀",
  },
};

export const DEFAULT_FAN_OUT: FanOutPolicy = "round_robin";
export const DEFAULT_CACHE_HIT_RATE = 0.8;
