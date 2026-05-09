import type { Level } from "../types/level";

export const LEVELS: Level[] = [
  {
    id: "01-hello-server",
    title: "Hello, Server",
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
];

export const LEVELS_BY_ID: Record<string, Level> = Object.fromEntries(
  LEVELS.map((l) => [l.id, l]),
);

export function getLevel(id: string): Level | undefined {
  return LEVELS_BY_ID[id];
}
