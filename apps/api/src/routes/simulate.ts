/**
 * POST /api/simulate
 *
 * Body: SimulationInput (zod-validated).
 * Response: SimulationResult — the full materialised list of TickFrames + the
 * final SimulationOutcome. Compute-once, ship-blob: client replays frames
 * locally at user-controlled speed.
 *
 * Hard caps (return 400):
 *  - Diagram > 50 nodes / 200 edges (enforced by zod).
 *  - Workload such that drained-tick horizon `ticks * 4 + 200` > MAX_FRAMES.
 *
 * Determinism: identical body → byte-identical JSON (verified by tests). The
 * route sets a short `Cache-Control` so reruns of the same input can be
 * deduplicated by the CDN.
 */
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  simulationInputSchema,
  MAX_FRAMES,
  type SimulationInput,
} from "@flow/shared/schemas/sim";
import { runSimulation } from "@flow/shared/simulation/run";

export const simulateRoute: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>().post(
    "/api/simulate",
    {
      schema: {
        body: simulationInputSchema,
      },
    },
    async (request, reply) => {
      const input = request.body as SimulationInput;

      // Catch oversized workloads BEFORE running the simulator. The drain
      // horizon mirrors the simulator's internal `maxTicks` formula.
      const drainedTicks = input.workload.ticks * 4 + 200;
      if (drainedTicks > MAX_FRAMES) {
        return reply.code(400).send({
          error: "WorkloadTooLarge",
          message: `Workload would generate up to ${drainedTicks} frames; max allowed is ${MAX_FRAMES}.`,
        });
      }

      const result = runSimulation(input as Parameters<typeof runSimulation>[0]);

      reply.header("Cache-Control", "public, max-age=60, stale-while-revalidate=600");
      return result;
    },
  );
};
