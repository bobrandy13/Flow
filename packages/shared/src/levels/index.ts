import type { Level } from "../types/level";
import {
  LESSON_01_HELLO_SERVER,
  LESSON_02_PERSISTENCE,
  LESSON_03_SCALE_OUT,
  LESSON_04_CACHE,
  LESSON_05_QUEUE_BURST,
  LESSON_06_ASYNC_WRITES,
  LESSON_07_SHARDING,
  LESSON_08_READ_WRITE_SPLIT,
  LESSON_09_OPEN_ENDED,
  LESSON_10_REPLICATE_FAILOVER,
  LESSON_11_RATE_LIMITER,
  LESSON_12_CIRCUIT_BREAKER,
  LESSON_13_DLQ,
  LESSON_14_CACHE_THE_WORLD,
  LESSON_15_TWO_CONTINENTS,
} from "./lessons";

export const LEVELS: Level[] = [
  {
    id: "01-hello-server",
    title: "Hello, Server",
    chapter: "Basics",
    lesson: LESSON_01_HELLO_SERVER,
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
    lesson: LESSON_02_PERSISTENCE,
    brief:
      "Servers forget everything when they restart — their memory is wiped. Add a database behind your server so writes are saved permanently. Note: you won't see this design fail in the simulation (a crash isn't part of the workload) — persistence is insurance for when things go wrong, not a throughput fix. Build the habit now. The client should still only talk to the server.",
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
    lesson: LESSON_03_SCALE_OUT,
    brief:
      "We've loaded your single-server design from the last level and aimed real traffic at it. Press Play: it drops over half of every request. One server has a hard ceiling, and you've hit it. Fix the design — put a load balancer in front of a pool of servers so the work spreads out. The database is shared.",
    // The student inherits the overloaded single-server topology and repairs it.
    // Proven: this design serves only ~52% at 22 req/tick; LB + 2 servers ~99%.
    starterDiagram: {
      nodes: [
        { id: "c1", kind: "client", position: { x: 80, y: 200 } },
        { id: "s1", kind: "server", position: { x: 340, y: 200 } },
        { id: "db1", kind: "database", position: { x: 600, y: 200 } },
      ],
      edges: [
        { id: "c1-s1", fromNodeId: "c1", toNodeId: "s1" },
        { id: "s1-db1", fromNodeId: "s1", toNodeId: "db1" },
      ],
    },
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
    lesson: LESSON_04_CACHE,
    brief:
      "Here's your scaled-out design: three servers behind a load balancer. Press Play — it's still dropping requests. But a fourth server won't save you: every server piles onto the same database, and the database is now the ceiling (try it — more servers change nothing). You can't out-scale this by adding machines. Instead, remove the work: put a cache between the servers and the database so most reads are answered instantly and never reach it.",
    // The student inherits the scaled L03 design — now DB-bottlenecked. Proven:
    // LB+3 servers at 28 req/tick serves ~89% (database is the wall); adding a
    // cache on the read path lifts it to ~99%. A 4th server does NOT help
    // (database ceiling), which is the whole lesson: eliminate work, don't add capacity.
    starterDiagram: {
      nodes: [
        { id: "c1", kind: "client", position: { x: 60, y: 220 } },
        { id: "lb1", kind: "load_balancer", position: { x: 260, y: 220 } },
        { id: "s1", kind: "server", position: { x: 480, y: 120 } },
        { id: "s2", kind: "server", position: { x: 480, y: 220 } },
        { id: "s3", kind: "server", position: { x: 480, y: 320 } },
        { id: "db1", kind: "database", position: { x: 720, y: 220 } },
      ],
      edges: [
        { id: "c1-lb1", fromNodeId: "c1", toNodeId: "lb1" },
        { id: "lb1-s1", fromNodeId: "lb1", toNodeId: "s1" },
        { id: "lb1-s2", fromNodeId: "lb1", toNodeId: "s2" },
        { id: "lb1-s3", fromNodeId: "lb1", toNodeId: "s3" },
        { id: "s1-db1", fromNodeId: "s1", toNodeId: "db1" },
        { id: "s2-db1", fromNodeId: "s2", toNodeId: "db1" },
        { id: "s3-db1", fromNodeId: "s3", toNodeId: "db1" },
      ],
    },
    allowedComponents: ["client", "server", "database", "load_balancer", "cache"],
    maxOf: { client: 1, load_balancer: 1, server: 3, cache: 1, database: 1 },
    rules: [
      { type: "requires_kind", kind: "cache", min: 1 },
      { type: "requires_path", from: "server", to: "cache" },
      { type: "requires_path", from: "cache", to: "database" },
    ],
    simulation: {
      workload: { requestsPerTick: 28, ticks: 120 },
      sla: { minSuccessRate: 0.9, maxP95Latency: 50 },
      seed: 4,
    },
  },
  // ---------- Chapter: Scaling ----------
  {
    id: "05-smooth-the-burst",
    title: "Smooth the Burst",
    chapter: "Scaling",
    lesson: LESSON_05_QUEUE_BURST,
    brief:
      "Traffic isn't uniform: bursts will overload a synchronous service. Spread requests across servers, then queue the database-write jobs so the database can drain them at its own steady pace.",
    allowedComponents: ["client", "load_balancer", "server", "queue", "database"],
    maxOf: { client: 1, load_balancer: 1, server: 4, queue: 1, database: 1 },
    rules: [
      { type: "requires_kind", kind: "load_balancer", min: 1 },
      { type: "requires_kind", kind: "server", min: 2 },
      { type: "requires_kind", kind: "queue", min: 1 },
      { type: "requires_path", from: "client", to: "load_balancer" },
      { type: "requires_path", from: "load_balancer", to: "server" },
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
    lesson: LESSON_06_ASYNC_WRITES,
    brief:
      "Writes don't need a synchronous round-trip to the database: load-balance multiple servers, accept the request, queue the work, and let the database drain at its own pace. Acknowledge fast, persist eventually.",
    allowedComponents: ["client", "load_balancer", "server", "queue", "database"],
    maxOf: { client: 1, load_balancer: 1, server: 4, queue: 1, database: 1 },
    rules: [
      { type: "requires_kind", kind: "load_balancer", min: 1 },
      { type: "requires_kind", kind: "server", min: 3 },
      { type: "requires_kind", kind: "queue", min: 1 },
      { type: "requires_kind", kind: "database", min: 1 },
      { type: "requires_path", from: "client", to: "load_balancer" },
      { type: "requires_path", from: "load_balancer", to: "server" },
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
    lesson: LESSON_07_SHARDING,
    brief:
      "One database can't keep up. Add a load balancer in front of multiple servers, then a shard router that deterministically partitions writes across multiple databases by key. More shards = more aggregate throughput.",
    allowedComponents: ["client", "load_balancer", "server", "shard", "database"],
    maxOf: { client: 1, load_balancer: 1, server: 4, shard: 1, database: 4 },
    rules: [
      { type: "requires_kind", kind: "load_balancer", min: 1 },
      { type: "requires_kind", kind: "server", min: 2 },
      { type: "requires_kind", kind: "shard", min: 1 },
      { type: "requires_kind", kind: "database", min: 2 },
      { type: "requires_path", from: "client", to: "load_balancer" },
      { type: "requires_path", from: "load_balancer", to: "server" },
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
    lesson: LESSON_08_READ_WRITE_SPLIT,
    brief:
      "Real systems mix reads and writes. Load-balance multiple servers, put a cache on the hot read path, and a queue in front of the database to absorb write bursts. Two patterns, one diagram.",
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
      { type: "requires_kind", kind: "load_balancer", min: 1 },
      { type: "requires_kind", kind: "server", min: 3 },
      { type: "requires_kind", kind: "cache", min: 1 },
      { type: "requires_kind", kind: "queue", min: 1 },
      { type: "requires_path", from: "load_balancer", to: "server" },
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
    lesson: LESSON_09_OPEN_ENDED,
    brief:
      "Big traffic, full toolbox. There's no single right answer: combine load balancers, caches, queues, and shards however you like. The simulation is the only judge.",
    allowedComponents: [
      "client",
      "load_balancer",
      "server",
      "cache",
      "cdn",
      "queue",
      "shard",
      "database",
    ],
    maxOf: { client: 1, load_balancer: 2, server: 6, cache: 2, cdn: 1, queue: 2, shard: 2, database: 4 },
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
  {
    id: "10-replicate-and-failover",
    title: "Replicate & Failover",
    chapter: "Reliability",
    lesson: LESSON_10_REPLICATE_FAILOVER,
    brief:
      "Mid-run, the database fails for a while. A single DB topology will lose every request during that window. Replicate the database so reads survive the outage.",
    allowedComponents: ["client", "server", "database"],
    maxOf: { client: 1, server: 1, database: 3 },
    rules: [
      { type: "requires_kind", kind: "database", min: 2 },
      { type: "requires_path", from: "client", to: "server" },
      { type: "requires_path", from: "server", to: "database" },
    ],
    simulation: {
      workload: {
        requestsPerTick: 8,
        ticks: 80,
        failures: [{ atTick: 20, durationTicks: 25, target: { kind: "database" } }],
      },
      sla: { minSuccessRate: 0.85, maxP95Latency: 100 },
      seed: 10,
    },
  },
  {
    id: "11-tame-the-spike",
    title: "Tame the Spike",
    chapter: "Reliability",
    lesson: LESSON_11_RATE_LIMITER,
    brief:
      "Bursty traffic overwhelms the downstream server. Insert a rate limiter to throttle arrivals at a sustainable rate; the limiter drops the excess so the server stays healthy.",
    allowedComponents: ["client", "rate_limiter", "server", "database"],
    maxOf: { client: 1, rate_limiter: 1, server: 1, database: 1 },
    rules: [
      { type: "requires_kind", kind: "rate_limiter", min: 1 },
      { type: "requires_path", from: "client", to: "rate_limiter" },
      { type: "requires_path", from: "rate_limiter", to: "server" },
    ],
    simulation: {
      workload: {
        requestsPerTick: 8,
        ticks: 80,
        bursts: [{ atTick: 20, durationTicks: 15, multiplier: 6 }],
      },
      sla: { minSuccessRate: 0.45, maxP95Latency: 100 },
      seed: 11,
    },
  },
  {
    id: "12-trip-the-breaker",
    title: "Trip the Breaker",
    chapter: "Reliability",
    lesson: LESSON_12_CIRCUIT_BREAKER,
    brief:
      "The database goes flaky for a window. Without a circuit breaker, the server's connection pool fills with hung requests. Insert a breaker so failures fast-fail and the server stays responsive.",
    allowedComponents: ["client", "server", "circuit_breaker", "database"],
    maxOf: { client: 1, server: 1, circuit_breaker: 1, database: 1 },
    rules: [
      { type: "requires_kind", kind: "circuit_breaker", min: 1 },
      { type: "requires_path", from: "server", to: "circuit_breaker" },
      { type: "requires_path", from: "circuit_breaker", to: "database" },
    ],
    simulation: {
      workload: {
        requestsPerTick: 6,
        ticks: 100,
        failures: [{ atTick: 20, durationTicks: 30, target: { kind: "database" } }],
      },
      sla: { minSuccessRate: 0.35, maxP95Latency: 100 },
      seed: 12,
    },
  },
  {
    id: "13-letters-that-wouldnt-send",
    title: "Letters that Wouldn't Send",
    chapter: "Reliability",
    lesson: LESSON_13_DLQ,
    brief:
      "Heavy write load to a slow consumer overflows the queue and you can't tell what was lost. Wire a dead-letter queue from the queue's overflow path to a database for later inspection.",
    allowedComponents: ["client", "server", "queue", "database"],
    maxOf: { client: 1, server: 1, queue: 1, database: 2 },
    rules: [
      { type: "requires_kind", kind: "queue", min: 1 },
      { type: "requires_kind", kind: "database", min: 2 },
      { type: "requires_path", from: "server", to: "queue" },
      { type: "requires_path", from: "queue", to: "database" },
    ],
    simulation: {
      workload: { requestsPerTick: 12, ticks: 60 },
      sla: { minSuccessRate: 0.5, maxP95Latency: 100 },
      seed: 13,
    },
  },
  {
    id: "14-cache-the-world",
    title: "Cache the World",
    chapter: "Edge",
    lesson: LESSON_14_CACHE_THE_WORLD,
    brief:
      "Read-heavy traffic is overwhelming a single origin server. Insert a CDN between client and origin so most reads terminate at the edge and never reach your backend.",
    allowedComponents: ["client", "cdn", "server", "database"],
    maxOf: { client: 1, cdn: 1, server: 1, database: 1 },
    rules: [
      { type: "requires_kind", kind: "cdn", min: 1 },
      { type: "requires_path", from: "client", to: "cdn" },
      { type: "requires_path", from: "cdn", to: "server" },
    ],
    simulation: {
      workload: { requestsPerTick: 90, ticks: 80 },
      sla: { minSuccessRate: 0.85, maxP95Latency: 100 },
      seed: 14,
    },
  },
  {
    id: "15-two-continents",
    title: "Two Continents",
    chapter: "Edge",
    lesson: LESSON_15_TWO_CONTINENTS,
    brief:
      "Your client lives in EU-West; your origin is in US-East. Every cross-Atlantic round-trip costs ~80ms. Place an edge CDN in EU-West so most reads terminate locally and your p95 stays inside SLA.",
    allowedComponents: ["client", "cdn", "server", "database"],
    maxOf: { client: 1, cdn: 1, server: 1, database: 1 },
    rules: [
      { type: "requires_kind", kind: "cdn", min: 1 },
      { type: "requires_path", from: "client", to: "cdn" },
    ],
    simulation: {
      workload: { requestsPerTick: 8, ticks: 80 },
      sla: { minSuccessRate: 0.85, maxP95Latency: 80 },
      seed: 15,
    },
  },
];

export const LEVELS_BY_ID: Record<string, Level> = Object.fromEntries(
  LEVELS.map((l) => [l.id, l]),
);

export function getLevel(id: string): Level | undefined {
  return LEVELS_BY_ID[id];
}
