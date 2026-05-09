"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SimulationInput } from "@flow/shared/simulation/simulator";
import type { SimulationOutcome, TickFrame } from "@flow/shared/types/validation";
import { simulationResultSchema } from "@flow/shared/schemas/sim";

const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:4000";

export interface UseSimulationResult {
  frame: TickFrame | null;
  outcome: SimulationOutcome | null;
  /** All frames from the most recent fetched run, for diagnostics/export. */
  frames: TickFrame[] | null;
  isRunning: boolean;
  isFinished: boolean;
  loading: boolean;
  error: string | null;
  /** Ticks per second target. */
  speed: number;
  setSpeed: (s: number) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
}

/**
 * Fetch-and-replay simulation driver.
 *
 * On first `play()` for a given `input`, POSTs to `/api/simulate`, validates
 * the response with the shared zod schema, and caches the frames+outcome in
 * a ref. The rAF loop then walks the cached frames at the user-controlled
 * speed. Subsequent play()/pause()/reset() within the same input identity
 * reuse the cached blob — pausing and resuming is instant, no refetch.
 */
export function useSimulation(input: SimulationInput | null): UseSimulationResult {
  const [frame, setFrame] = useState<TickFrame | null>(null);
  const [outcome, setOutcome] = useState<SimulationOutcome | null>(null);
  const [frames, setFrames] = useState<TickFrame[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(8);

  const framesRef = useRef<TickFrame[] | null>(null);
  const outcomeRef = useRef<SimulationOutcome | null>(null);
  const frameIndexRef = useRef(0);

  const rafRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const tickAccumulatorRef = useRef(0);
  const speedRef = useRef(speed);
  const inputRef = useRef<SimulationInput | null>(input);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { speedRef.current = speed; }, [speed]);

  const stopRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTimestampRef.current = null;
    tickAccumulatorRef.current = 0;
  }, []);

  const reset = useCallback(() => {
    stopRaf();
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    framesRef.current = null;
    outcomeRef.current = null;
    frameIndexRef.current = 0;
    setFrames(null);
    setIsRunning(false);
    setFrame(null);
    setOutcome(null);
    setError(null);
    setLoading(false);
  }, [stopRaf]);

  // Reset whenever input identity changes.
  useEffect(() => {
    if (inputRef.current !== input) {
      inputRef.current = input;
      reset();
    }
  }, [input, reset]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      stopRaf();
      if (abortRef.current) abortRef.current.abort();
    };
  }, [stopRaf]);

  const tickLoopRef = useRef<((ts: number) => void) | null>(null);
  const tickLoop = useCallback((ts: number) => {
    const frames = framesRef.current;
    if (!frames) {
      stopRaf();
      setIsRunning(false);
      return;
    }
    if (lastTimestampRef.current == null) lastTimestampRef.current = ts;
    const dt = ts - lastTimestampRef.current;
    lastTimestampRef.current = ts;
    tickAccumulatorRef.current += (dt / 1000) * speedRef.current;

    let lastFrame: TickFrame | null = null;
    let finished = false;
    const maxStepsThisFrame = Math.max(1, Math.ceil(speedRef.current));
    let steps = 0;
    while (
      tickAccumulatorRef.current >= 1 &&
      steps < maxStepsThisFrame &&
      frameIndexRef.current < frames.length
    ) {
      lastFrame = frames[frameIndexRef.current];
      frameIndexRef.current += 1;
      tickAccumulatorRef.current -= 1;
      steps += 1;
    }
    if (frameIndexRef.current >= frames.length) {
      finished = true;
    }

    if (lastFrame) setFrame(lastFrame);
    if (finished) {
      setOutcome(outcomeRef.current);
      setIsRunning(false);
      stopRaf();
      return;
    }
    rafRef.current = requestAnimationFrame(tickLoopRef.current!);
  }, [stopRaf]);
  useEffect(() => { tickLoopRef.current = tickLoop; }, [tickLoop]);

  const startReplay = useCallback(() => {
    if (!framesRef.current) return;
    setIsRunning(true);
    lastTimestampRef.current = null;
    tickAccumulatorRef.current = 0;
    rafRef.current = requestAnimationFrame(tickLoopRef.current!);
  }, []);

  const fetchAndReplay = useCallback(async (currentInput: SimulationInput) => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(`${API_BASE}/api/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentInput),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Simulate failed (${res.status}): ${text || res.statusText}`);
      }
      const json = await res.json();
      const parsed = simulationResultSchema.parse(json);
      // The wire schema infers structurally-identical shapes to the engine
      // types, but with looser config typing — cast at the boundary.
      framesRef.current = parsed.frames as unknown as TickFrame[];
      outcomeRef.current = parsed.outcome as unknown as SimulationOutcome;
      frameIndexRef.current = 0;
      setFrames(framesRef.current);
      setLoading(false);
      startReplay();
    } catch (err) {
      if (controller.signal.aborted) return;
      setLoading(false);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [startReplay]);

  const play = useCallback(() => {
    if (!input) return;
    if (isRunning || loading) return;
    if (framesRef.current) {
      // Replay cached frames. If we're at the end already, restart.
      if (frameIndexRef.current >= framesRef.current.length) {
        frameIndexRef.current = 0;
        setOutcome(null);
        setFrame(null);
      }
      startReplay();
      return;
    }
    void fetchAndReplay(input);
  }, [input, isRunning, loading, fetchAndReplay, startReplay]);

  const pause = useCallback(() => {
    stopRaf();
    setIsRunning(false);
  }, [stopRaf]);

  return {
    frame,
    outcome,
    frames,
    isRunning,
    isFinished: outcome != null,
    loading,
    error,
    speed,
    setSpeed,
    play,
    pause,
    reset,
  };
}
