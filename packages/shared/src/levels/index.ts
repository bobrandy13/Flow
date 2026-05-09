import type { Level } from "../types/level";

export const LEVELS: Level[] = [
  {
    id: "01-hello-server",
    title: "Hello, Server",
    chapter: "Basics",
    brief:
      "Connect a single client to a single server so requests can be received. Your first system: a request, a response, and the wire between them.",
    allowedComponents: ["client", "server"],
    maxOf: { client: 1, server: 1 },
    rules: [
      { type: "requires_kind", kind: "client", min: 1 },
      { type: "requires_kind", kind: "server", min: 1 },
      { type: "requires_path", from: "client", to: "server" },
    ],
    simulation: {
      workload: { requestsPerTick: 5, ticks: 50 },
      sla: { minSuccessRate: 0.95, maxP95Latency: 30 },
      seed: 1,
    },
  },
  {
    id: "02-add-a-database",
    title: "Persistence Layer",
    chapter: "Basics",
    brief:
      "Servers are stateless. Add a database behind your server so writes survive a restart. The client should still only talk to the server.",
    allowedComponents: ["client", "server", "database"],
    maxOf: { client: 1, server: 1, database: 1 },
    rules: [
      { type: "requires_kind", kind: "database", min: 1 },
      { type: "requires_path", from: "client", to: "server" },
      { type: "requires_path", from: "server", to: "database" },
    ],
    simulation: {
      workload: { requestsPerTick: 8, ticks: 80 },
      sla: { minSuccessRate: 0.9, maxP95Latency: 30 },
      seed: 2,
    },
  },
  {
    id: "03-scale-with-load-balancer",
    title: "Scale Out",
    chapter: "Basics",
    brief:
      "One server can't keep up. Place a load balancer in front of two servers so traffic is spread across them. The database is shared.",
    allowedComponents: ["client", "server", "database", "load_balancer"],
    maxOf: { client: 1, load_balancer: 1, server: 4, database: 1 },
    rules: [
      { type: "requires_kind", kind: "load_balancer", min: 1 },
      { type: "requires_kind", kind: "server", min: 2 },
      { type: "requires_path", from: "client", to: "load_balancer" },
      { type: "requires_path", from: "load_balancer", to: "server" },
      { type: "requires_path", from: "server", to: "database" },
    ],
    simulation: {
      workload: { requestsPerTick: 22, ticks: 100 },
      sla: { minSuccessRate: 0.9, maxP95Latency: 50 },
      seed: 3,
    },
  },
  {
    id: "04-add-a-cache",
    title: "Cache the Hot Path",
    chapter: "Basics",
    brief:
      "Database reads are expensive. Put a cache between your servers and the database. Tune the hit rate on the cache edge.",
    allowedComponents: ["client", "server", "database", "load_balancer", "cache"],
    rules: [
      { type: "requires_kind", kind: "cache", min: 1 },
      { type: "requires_path", from: "client", to: "server" },
      { type: "requires_path", from: "server", to: "cache" },
    ],
    simulation: {
      workload: { requestsPerTick: 18, ticks: 120 },
      sla: { minSuccessRate: 0.9, maxP95Latency: 40 },
      seed: 4,
    },
  },
  // ---------- Chapter: Scaling ----------
  {
    id: "05-smooth-the-burst",
    title: "Smooth the Burst",
    chapter: "Scaling",
    brief:
      "Traffic isn't uniform — bursts will overload a synchronous service. Place a queue between your servers and the database so spikes are absorbed instead of dropped.",
    allowedComponents: ["client", "load_balancer", "server", "queue", "database"],
    maxOf: { client: 1, load_balancer: 1, server: 4, queue: 1, database: 1 },
    rules: [
      { type: "requires_kind", kind: "queue", min: 1 },
      { type: "requires_path", from: "client", to: "server" },
      { type: "requires_path", from: "server", to: "queue" },
      { type: "requires_path", from: "queue", to: "database" },
    ],
    simulation: {
      workload: {
        requestsPerTick: 12,
        ticks: 120,
        bursts: [{ atTick: 30, durationTicks: 20, multiplier: 4 }],
      },
      sla: { minSuccessRate: 0.85, maxP95Latency: 80 },
      seed: 5,
    },
  },
  {
    id: "06-async-writes",
    title: "Async Writes",
    chapter: "Scaling",
    brief:
      "Writes don't need a synchronous round-trip to the database — accept the request, queue the work, and let the database drain at its own pace. Acknowledge fast, persist eventually.",
    allowedComponents: ["client", "load_balancer", "server", "queue", "database"],
    maxOf: { client: 1, load_balancer: 1, server: 4, queue: 1, database: 1 },
    rules: [
      { type: "requires_kind", kind: "queue", min: 1 },
      { type: "requires_kind", kind: "database", min: 1 },
      { type: "requires_path", from: "client", to: "server" },
      { type: "requires_path", from: "server", to: "queue" },
      { type: "requires_path", from: "queue", to: "database" },
    ],
    simulation: {
      workload: { requestsPerTick: 40, ticks: 100 },
      sla: { minSuccessRate: 0.9, maxP95Latency: 80 },
      seed: 6,
    },
  },
  {
    id: "07-shard-the-database",
    title: "Shard the Database",
    chapter: "Scaling",
    brief:
      "One database can't keep up. Add a shard router that deterministically partitions requests across multiple databases by key. More shards = more aggregate throughput.",
    allowedComponents: ["client", "load_balancer", "server", "shard", "database"],
    maxOf: { client: 1, load_balancer: 1, server: 4, shard: 1, database: 4 },
    rules: [
      { type: "requires_kind", kind: "shard", min: 1 },
      { type: "requires_kind", kind: "database", min: 2 },
      { type: "requires_path", from: "client", to: "server" },
      { type: "requires_path", from: "server", to: "shard" },
      { type: "requires_path", from: "shard", to: "database" },
    ],
    simulation: {
      workload: { requestsPerTick: 28, ticks: 100 },
      sla: { minSuccessRate: 0.9, maxP95Latency: 80 },
      seed: 7,
    },
  },
  // ---------- Chapter: Composition ----------
  {
    id: "08-read-write-split",
    title: "Read + Write Split",
    chapter: "Composition",
    brief:
      "Real systems mix reads and writes. Put a cache on the hot read path, and a queue in front of the database to absorb write bursts. Two patterns, one diagram.",
    allowedComponents: [
      "client",
      "load_balancer",
      "server",
      "cache",
      "queue",
      "database",
    ],
    maxOf: { client: 1, load_balancer: 1, server: 4, cache: 1, queue: 1, database: 1 },
    rules: [
      { type: "requires_kind", kind: "cache", min: 1 },
      { type: "requires_kind", kind: "queue", min: 1 },
      { type: "requires_path", from: "server", to: "cache" },
      { type: "requires_path", from: "server", to: "queue" },
    ],
    simulation: {
      workload: {
        requestsPerTick: 24,
        ticks: 120,
        bursts: [{ atTick: 60, durationTicks: 15, multiplier: 2 }],
      },
      sla: { minSuccessRate: 0.85, maxP95Latency: 80 },
      seed: 8,
    },
  },
  {
    id: "09-open-ended-scale",
    title: "Open Ended",
    chapter: "Composition",
    brief:
      "Big traffic, full toolbox. There's no single right answer — combine load balancers, caches, queues, and shards however you like. The simulation is the only judge.",
    allowedComponents: [
      "client",
      "load_balancer",
      "server",
      "cache",
      "queue",
      "shard",
      "database",
    ],
    maxOf: { client: 1, load_balancer: 2, server: 6, cache: 2, queue: 2, shard: 2, database: 4 },
    rules: [
      { type: "requires_kind", kind: "server", min: 2 },
      { type: "requires_path", from: "client", to: "server" },
    ],
    simulation: {
      workload: {
        requestsPerTick: 36,
        ticks: 120,
        bursts: [{ atTick: 40, durationTicks: 20, multiplier: 2 }],
      },
      sla: { minSuccessRate: 0.85, maxP95Latency: 100 },
      seed: 9,
    },
  },
];

export const LEVELS_BY_ID: Record<string, Level> = Object.fromEntries(
  LEVELS.map((l) => [l.id, l]),
);

export function getLevel(id: string): Level | undefined {
  return LEVELS_BY_ID[id];
}
