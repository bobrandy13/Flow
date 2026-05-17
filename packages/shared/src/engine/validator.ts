import type { Diagram } from "../types/diagram";
import type { ComponentKind } from "../types/components";
import type { Rule, RuleResult } from "../types/validation";
import { COMPONENT_SPECS } from "./component-specs";

export function evaluateRules(diagram: Diagram, rules: Rule[]): RuleResult[] {
  return rules.map((rule) => evaluateRule(diagram, rule));
}

function evaluateRule(diagram: Diagram, rule: Rule): RuleResult {
  switch (rule.type) {
    case "requires_kind": {
      const count = diagram.nodes.filter((n) => n.kind === rule.kind).length;
      const passed = count >= rule.min;
      return {
        rule,
        passed,
        message: passed
          ? `Has ${formatCount(count, rule.kind)}.`
          : missingKindMessage(rule.kind, rule.min, count),
      };
    }
    case "forbidden": {
      const count = diagram.nodes.filter((n) => n.kind === rule.kind).length;
      const passed = count === 0;
      return {
        rule,
        passed,
        message: passed
          ? `No ${rule.kind} present.`
          : `${rule.kind} is forbidden in this level (found ${count}).`,
      };
    }
    case "requires_path": {
      const passed = pathExists(diagram, rule.from, rule.to);
      return {
        rule,
        passed,
        message: passed
          ? `Path exists: ${labelFor(rule.from)} -> ${labelFor(rule.to)}.`
          : missingPathMessage(diagram, rule.from, rule.to),
      };
    }
  }
}

function labelFor(kind: ComponentKind): string {
  return COMPONENT_SPECS[kind].label;
}

function formatCount(count: number, kind: ComponentKind): string {
  const label = labelFor(kind);
  return `${count} ${label} ${count === 1 ? "node" : "nodes"}`;
}

function missingKindMessage(kind: ComponentKind, min: number, count: number): string {
  const label = labelFor(kind);
  const found = count === 0 ? "none are on the canvas yet" : `found ${formatCount(count, kind)}`;
  const base = `Add ${min === 1 ? "a" : min} ${label} ${min === 1 ? "node" : "nodes"} (${found}).`;
  const hint = KIND_HINTS[kind];
  return hint ? `${base} ${hint}` : base;
}

function missingPathMessage(diagram: Diagram, from: ComponentKind, to: ComponentKind): string {
  const key = `${from}->${to}` as PathHintKey;
  const hint = PATH_HINTS[key];
  const sourceCount = diagram.nodes.filter((node) => node.kind === from).length;
  const targetCount = diagram.nodes.filter((node) => node.kind === to).length;

  if (sourceCount === 0 || targetCount === 0) {
    const missing = [
      sourceCount === 0 ? labelFor(from) : null,
      targetCount === 0 ? labelFor(to) : null,
    ].filter(Boolean).join(" and ");
    return `Add the missing ${missing} node first, then wire ${labelFor(from)} -> ${labelFor(to)}. ${hint ?? ""}`.trim();
  }

  return hint ?? `Wire ${labelFor(from)} -> ${labelFor(to)} so traffic can reach the required next step.`;
}

const KIND_HINTS: Partial<Record<ComponentKind, string>> = {
  client: "The client is where requests start.",
  server: "Servers run the app logic that receives and forwards requests.",
  database: "The database stores data after the server handles the request.",
  load_balancer: "Put it between the client and servers so traffic is spread across multiple servers.",
  cache: "For this lesson, the cache should sit on the read path: Server -> Cache -> Database.",
  queue: "Use it between fast producers and slower consumers so bursts wait instead of being dropped.",
  shard: "Use the shard router between servers and databases so requests can be split across database shards.",
  rate_limiter: "Put it before the service you want to protect from too much traffic.",
  circuit_breaker: "Put it before a fragile downstream dependency so failures stop quickly instead of piling up.",
  cdn: "Put it before the origin server so cacheable reads can be answered near the user.",
};

const PATH_HINTS = {
  "client->server": "Connect Client -> Server so requests have somewhere to enter your system.",
  "server->database": "Connect Server -> Database so app logic can read and write stored data.",
  "client->load_balancer": "Connect Client -> Load Balancer so requests reach the traffic splitter first.",
  "load_balancer->server": "Connect Load Balancer -> Server so it can spread requests across your servers.",
  "server->cache": "Connect Server -> Cache so repeated reads can return quickly instead of making every request wait on the database. For misses, continue with Cache -> Database.",
  "cache->database": "Connect Cache -> Database so cache misses can still fetch the real data.",
  "server->queue": "Connect Server -> Queue so the server can queue database-write jobs and reply quickly instead of waiting for storage.",
  "queue->database": "Connect Queue -> Database so the queued write jobs have a consumer to drain them. In a real app this consumer is often a worker service; in this level the database node stands in for that consumer.",
  "server->shard": "Connect Server -> Shard Router so database requests can be routed to the right shard.",
  "shard->database": "Connect Shard Router -> Database so routed requests can reach the shard databases.",
  "client->rate_limiter": "Connect Client -> Rate Limiter so excess traffic is controlled before it reaches the server.",
  "rate_limiter->server": "Connect Rate Limiter -> Server so accepted requests can continue through the app.",
  "server->circuit_breaker": "Connect Server -> Circuit Breaker so calls to the downstream dependency can fail fast when it is unhealthy.",
  "circuit_breaker->database": "Connect Circuit Breaker -> Database so healthy requests still reach storage.",
  "client->cdn": "Connect Client -> CDN so cacheable reads are tried at the edge before hitting the origin.",
  "cdn->server": "Connect CDN -> Server so cache misses can reach the origin.",
} satisfies Partial<Record<`${ComponentKind}->${ComponentKind}`, string>>;

type PathHintKey = keyof typeof PATH_HINTS;

/** BFS over the directed diagram from any node of `from` kind to any node of `to` kind. */
export function pathExists(diagram: Diagram, from: ComponentKind, to: ComponentKind): boolean {
  const adj = buildAdjacency(diagram);
  const sources = diagram.nodes.filter((n) => n.kind === from).map((n) => n.id);
  const targetIds = new Set(diagram.nodes.filter((n) => n.kind === to).map((n) => n.id));
  if (sources.length === 0 || targetIds.size === 0) return false;

  const seen = new Set<string>();
  const queue: string[] = [...sources];
  while (queue.length) {
    const cur = queue.shift()!;
    if (targetIds.has(cur) && !sources.includes(cur)) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const next of adj.get(cur) ?? []) {
      if (targetIds.has(next)) return true;
      if (!seen.has(next)) queue.push(next);
    }
  }
  return false;
}

export function buildAdjacency(diagram: Diagram): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const n of diagram.nodes) adj.set(n.id, []);
  for (const e of diagram.edges) {
    if (!adj.has(e.fromNodeId)) adj.set(e.fromNodeId, []);
    adj.get(e.fromNodeId)!.push(e.toNodeId);
  }
  return adj;
}
