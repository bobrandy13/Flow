/**
 * Synchronous "compute everything" wrapper around the streaming simulator.
 *
 * The engine is a generator that yields one `TickFrame` per simulated tick
 * and finally returns the `SimulationOutcome`. The Fastify route just needs
 * the materialised array of frames + the outcome, so this helper drains the
 * generator and packages both into a single `SimulationResult`.
 */
import { simulateStream, type SimulationInput as EngineInput } from "./simulator";
import type { SimulationResult } from "../schemas/sim";

export class SimulationTimeoutError extends Error {
  constructor(public readonly budgetMs: number) {
    super(`Simulation exceeded ${budgetMs}ms CPU budget`);
    this.name = "SimulationTimeoutError";
  }
}

export interface RunSimulationOptions {
  /**
   * Wall-clock CPU budget in milliseconds. When exceeded, throws
   * `SimulationTimeoutError`. Checked between simulator frames so a single
   * pathological frame can still overrun by a small amount, but the simulator
   * cannot pin the event loop for arbitrary time.
   */
  deadlineMs?: number;
}

export function runSimulation(
  input: EngineInput,
  opts: RunSimulationOptions = {},
): SimulationResult {
  const { deadlineMs } = opts;
  const start = deadlineMs != null ? Date.now() : 0;
  const stream = simulateStream(input);
  const frames: SimulationResult["frames"] = [];
  let result = stream.next();
  while (!result.done) {
    frames.push(result.value);
    if (deadlineMs != null && Date.now() - start > deadlineMs) {
      throw new SimulationTimeoutError(deadlineMs);
    }
    result = stream.next();
  }
  return { frames, outcome: result.value };
}
