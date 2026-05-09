import { describe, it, expect } from "vitest";
import {
  MS_PER_TICK,
  ticksToMs,
  msToTicks,
  throughputPerSecond,
  formatLatency,
  formatCapacity,
  formatSuccessRate,
  KIND_EXPLAINERS,
  METRIC_EXPLAINERS,
} from "../engine/units";
import { COMPONENT_KINDS } from "@/types/components";
import { COMPONENT_SPECS } from "@/lib/engine/component-specs";

describe("units", () => {
  it("ticks <-> ms round-trip with MS_PER_TICK = 10", () => {
    expect(MS_PER_TICK).toBe(10);
    expect(ticksToMs(4)).toBe(40);
    expect(msToTicks(40)).toBe(4);
  });

  it("throughputPerSecond = capacity / serviceMs * 1000", () => {
    // server: capacity 80, latency 3 ticks (30ms) -> 80/30 * 1000 = 2666.67 req/s
    expect(throughputPerSecond({ capacity: 80, baseLatency: 3 })).toBeCloseTo(2666.67, 1);
    expect(throughputPerSecond({ capacity: 1, baseLatency: 1 })).toBeCloseTo(100);
    expect(throughputPerSecond({ capacity: Infinity, baseLatency: 1 })).toBe(Infinity);
    expect(throughputPerSecond({ capacity: 10, baseLatency: 0 })).toBe(Infinity);
  });

  it("formatLatency renders ms primary, ticks secondary", () => {
    const f = formatLatency(4);
    expect(f.primary).toBe("40 ms");
    expect(f.secondary).toMatch(/4 ticks/);
    expect(formatLatency(1).secondary).toMatch(/1 tick$/);
  });

  it("formatCapacity renders concurrent + req/s", () => {
    const f = formatCapacity({ capacity: 80, baseLatency: 3 });
    expect(f.primary).toBe("80 concurrent");
    expect(f.secondary).toMatch(/req\/s/);
  });

  it("formatCapacity handles unbounded (e.g. clients)", () => {
    const f = formatCapacity({ capacity: Infinity, baseLatency: 0 });
    expect(f.primary).toBe("unbounded");
  });

  it("formatSuccessRate gives one-decimal percent", () => {
    expect(formatSuccessRate(0.951)).toBe("95.1%");
    expect(formatSuccessRate(1)).toBe("100.0%");
  });

  it("KIND_EXPLAINERS covers every component kind with non-empty fields", () => {
    for (const kind of COMPONENT_KINDS) {
      const e = KIND_EXPLAINERS[kind];
      expect(e, `missing explainer for ${kind}`).toBeDefined();
      expect(e.one_liner.length).toBeGreaterThan(5);
      expect(e.what_it_does.length).toBeGreaterThan(20);
      expect(e.analogy.length).toBeGreaterThan(5);
    }
  });

  it("METRIC_EXPLAINERS covers each result metric", () => {
    for (const key of ["successRate", "avgLatency", "p95Latency", "drops", "bottleneck"]) {
      expect(METRIC_EXPLAINERS[key]?.length ?? 0).toBeGreaterThan(20);
    }
  });

  it("derived throughput sanity-matches sustainability of level workloads", () => {
    // With server capacity 80 latency 3 ticks => >2000 req/s. Every level's
    // requests/sec is well under what one server can sustain.
    const serverThroughput = throughputPerSecond(COMPONENT_SPECS.server);
    expect(serverThroughput).toBeGreaterThan(2000);
    const dbThroughput = throughputPerSecond(COMPONENT_SPECS.database);
    expect(dbThroughput).toBeGreaterThan(2000);
  });
});
