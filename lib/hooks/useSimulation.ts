"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { simulateStream, type SimulationInput } from "@/lib/simulation/simulator";
import type { SimulationOutcome, TickFrame } from "@/types/validation";

export interface UseSimulationResult {
  frame: TickFrame | null;
  outcome: SimulationOutcome | null;
  isRunning: boolean;
  isFinished: boolean;
  /** Ticks per second target. */
  speed: number;
  setSpeed: (s: number) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
}

/**
 * Drives a `simulateStream()` generator using requestAnimationFrame.
 *
 * - The generator lives in a ref so it survives renders.
 * - When `input` changes (or becomes null), the run is reset.
 * - `speed` is in ticks/sec; we accumulate wall-clock dt and advance multiple
 *   ticks per frame at higher speeds so the UI never drops frames.
 */
export function useSimulation(input: SimulationInput | null): UseSimulationResult {
  const [frame, setFrame] = useState<TickFrame | null>(null);
  const [outcome, setOutcome] = useState<SimulationOutcome | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(8);

  const generatorRef = useRef<Generator<TickFrame, SimulationOutcome, void> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const tickAccumulatorRef = useRef(0);
  const speedRef = useRef(speed);
  const inputRef = useRef<SimulationInput | null>(input);

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
    generatorRef.current = null;
    setIsRunning(false);
    setFrame(null);
    setOutcome(null);
  }, [stopRaf]);

  // Reset whenever input identity changes.
  useEffect(() => {
    if (inputRef.current !== input) {
      inputRef.current = input;
      reset();
    }
  }, [input, reset]);

  // Cleanup on unmount.
  useEffect(() => () => stopRaf(), [stopRaf]);

  const tickLoopRef = useRef<((ts: number) => void) | null>(null);
  const tickLoop = useCallback((ts: number) => {
    if (!generatorRef.current) {
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
    let finalOutcome: SimulationOutcome | null = null;
    // Cap ticks per RAF to avoid pathological catch-up loops.
    const maxStepsThisFrame = Math.max(1, Math.ceil(speedRef.current));
    let steps = 0;
    while (tickAccumulatorRef.current >= 1 && steps < maxStepsThisFrame) {
      const result = generatorRef.current.next();
      tickAccumulatorRef.current -= 1;
      steps += 1;
      if (result.done) {
        finalOutcome = result.value;
        finished = true;
        break;
      }
      lastFrame = result.value;
    }

    if (lastFrame) setFrame(lastFrame);
    if (finished) {
      setOutcome(finalOutcome);
      setIsRunning(false);
      stopRaf();
      generatorRef.current = null;
      return;
    }
    rafRef.current = requestAnimationFrame(tickLoopRef.current!);
  }, [stopRaf]);
  useEffect(() => { tickLoopRef.current = tickLoop; }, [tickLoop]);

  const play = useCallback(() => {
    if (!input) return;
    if (isRunning) return;
    if (!generatorRef.current) {
      generatorRef.current = simulateStream(input);
      setOutcome(null);
    }
    setIsRunning(true);
    lastTimestampRef.current = null;
    tickAccumulatorRef.current = 0;
    rafRef.current = requestAnimationFrame(tickLoopRef.current!);
  }, [input, isRunning]);

  const pause = useCallback(() => {
    stopRaf();
    setIsRunning(false);
  }, [stopRaf]);

  return {
    frame,
    outcome,
    isRunning,
    isFinished: outcome != null,
    speed,
    setSpeed,
    play,
    pause,
    reset,
  };
}
