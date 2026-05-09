import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSimulation } from "@/lib/hooks/useSimulation";
import type { SimulationInput } from "@flow/shared/simulation/simulator";
import type { Diagram } from "@flow/shared/types/diagram";

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

/** Drive RAF + perf timeline by `ms` milliseconds in `step` chunks. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function advance(ms: number, step = 16) {
  let elapsed = 0;
  while (elapsed < ms) {
    elapsed += step;
    vi.advanceTimersByTime(step);
  }
}

describe("useSimulation", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts in an idle state with no frame and no outcome", () => {
    const { result } = renderHook(() => useSimulation(input));
    expect(result.current.frame).toBeNull();
    expect(result.current.outcome).toBeNull();
    expect(result.current.isRunning).toBe(false);
  });

  it("returns an outcome after the stream completes", async () => {
    // Use a tiny RAF stub so we can deterministically tick the loop.
    let nextRaf = 0;
    const rafCallbacks: Array<(ts: number) => void> = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return ++nextRaf;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    const { result } = renderHook(() => useSimulation(input));
    act(() => { result.current.setSpeed(32); });
    act(() => { result.current.play(); });

    // Drain RAFs until the run finishes.
    let ts = 0;
    let safety = 0;
    while (rafCallbacks.length && safety < 500) {
      const cb = rafCallbacks.shift()!;
      ts += 100; // 100ms per "frame" → with speed=32 ticks/s, ~3 ticks per call
      act(() => cb(ts));
      safety += 1;
    }
    expect(result.current.outcome).not.toBeNull();
    expect(result.current.isRunning).toBe(false);
  });

  it("reset() clears frame, outcome, and isRunning", () => {
    const { result } = renderHook(() => useSimulation(input));
    act(() => { result.current.reset(); });
    expect(result.current.frame).toBeNull();
    expect(result.current.outcome).toBeNull();
    expect(result.current.isRunning).toBe(false);
  });

  it("does not start when input is null", () => {
    const { result } = renderHook(() => useSimulation(null));
    act(() => { result.current.play(); });
    expect(result.current.isRunning).toBe(false);
  });
});
