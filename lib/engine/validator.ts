import type { Diagram } from "@/types/diagram";
import type { ComponentKind } from "@/types/components";
import type { Rule, RuleResult } from "@/types/validation";

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
          ? `Has ${count} ${rule.kind}(s) (≥ ${rule.min}).`
          : `Needs at least ${rule.min} ${rule.kind}(s); found ${count}.`,
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
          ? `Path exists from ${rule.from} → ${rule.to}.`
          : `Missing a path from any ${rule.from} to a ${rule.to}.`,
      };
    }
  }
}

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
