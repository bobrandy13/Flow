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

export function runSimulation(input: EngineInput): SimulationResult {
  const stream = simulateStream(input);
  const frames: SimulationResult["frames"] = [];
  let result = stream.next();
  while (!result.done) {
    frames.push(result.value);
    result = stream.next();
  }
  return { frames, outcome: result.value };
}
