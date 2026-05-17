import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSimulation } from "@/lib/hooks/useSimulation";
import type { SimulationInput } from "@flow/shared/simulation/simulator";
import type { Diagram } from "@flow/shared/types/diagram";
import type { TickFrame, SimulationOutcome } from "@flow/shared/types/validation";

const diagram: Diagram = {
  nodes: [
    { id: "c", kind: "client", position: { x: 0, y: 0 } },
    { id: "s", kind: "server", position: { x: 0, y: 0 } },
  ],
  edges: [
    { id: "e1", fromNodeId: "c", toNodeId: "s" },
    { id: "e2", fromNodeId: "s", toNodeId: "c" },
  ],
};

const input: SimulationInput = {
  diagram,
  workload: { requestsPerTick: 4, ticks: 20 },
  sla: { minSuccessRate: 0.9, maxP95Latency: 100 },
  seed: 1,
};

function makeFrames(n: number): TickFrame[] {
  return Array.from({ length: n }, (_, i) => ({
    tick: i,
    perNode: {
      c: {
        inFlight: 0, peakInFlight: 0, utilization: 0,
        servedTotal: 0, droppedTotal: 0,
        servedThisTick: 0, droppedThisTick: 0,
        pendingDepth: 0, peakPendingDepth: 0,
      },
    },
    transitions: [],
    metricsSoFar: { avgLatency: 0, p95Latency: 0, successRate: 1, drops: 0 },
    phase: "steady" as const,
  }));
}

const outcome: SimulationOutcome = {
  passed: true,
  metrics: { avgLatency: 1, p95Latency: 2, successRate: 1, drops: 0 },
  diagnosis: {
    category: "passed_clean",
    headline: "Clean pass",
    explanation: "",
    culpritNodeIds: [],
    evidence: [],
    suggestions: [],
  },
};

function mockFetchOk(frames: TickFrame[]) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ frames, outcome }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("useSimulation (fetch + replay)", () => {
  beforeEach(() => {
    let nextRaf = 0;
    const cbs: Array<(ts: number) => void> = [];
    // @ts-expect-error attach for tests
    globalThis.__rafCbs = cbs;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cbs.push(cb);
      return ++nextRaf;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    // @ts-expect-error cleanup
    delete globalThis.__rafCbs;
  });

  function drainRaf(maxIter = 200) {
    // @ts-expect-error injected above
    const cbs: Array<(ts: number) => void> = globalThis.__rafCbs;
    let ts = 0;
    let i = 0;
    while (cbs.length && i < maxIter) {
      const cb = cbs.shift()!;
      ts += 100;
      act(() => cb(ts));
      i += 1;
    }
  }

  it("starts in an idle state with no frame and no outcome", () => {
    const { result } = renderHook(() => useSimulation(input));
    expect(result.current.frame).toBeNull();
    expect(result.current.outcome).toBeNull();
    expect(result.current.isRunning).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("fetches, replays frames, and surfaces the outcome", async () => {
    mockFetchOk(makeFrames(15));
    const { result } = renderHook(() => useSimulation(input));
    act(() => { result.current.setSpeed(32); });
    act(() => { result.current.play(); });
    await waitFor(() => expect(result.current.loading).toBe(false));
    drainRaf();
    expect(result.current.outcome).not.toBeNull();
    expect(result.current.outcome?.passed).toBe(true);
    expect(result.current.isRunning).toBe(false);
  });

  it("surfaces an error when the API responds with non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 500 }),
    );
    const { result } = renderHook(() => useSimulation(input));
    act(() => { result.current.play(); });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.loading).toBe(false);
    expect(result.current.isRunning).toBe(false);
  });

  it("reset() clears frame, outcome, error, and isRunning", () => {
    const { result } = renderHook(() => useSimulation(input));
    act(() => { result.current.reset(); });
    expect(result.current.frame).toBeNull();
    expect(result.current.outcome).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isRunning).toBe(false);
  });

  it("does not fetch when input is null", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { result } = renderHook(() => useSimulation(null));
    act(() => { result.current.play(); });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.isRunning).toBe(false);
  });
});
