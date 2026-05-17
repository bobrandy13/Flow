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
import {
  runSimulation,
  SimulationTimeoutError,
} from "@flow/shared/simulation/run";

export interface SimulateRouteOptions {
  /** Wall-clock CPU budget per request. */
  simulationBudgetMs: number;
}

export const simulateRoute: FastifyPluginAsync<SimulateRouteOptions> = async (
  fastify,
  opts,
) => {
  const budgetMs = opts.simulationBudgetMs;

  fastify.withTypeProvider<ZodTypeProvider>().post(
    "/api/simulate",
    {
      schema: {
        body: simulationInputSchema,
      },
    },
    async (request, reply) => {
      const input = request.body as SimulationInput;

      const drainedTicks = input.workload.ticks * 4 + 200;
      if (drainedTicks > MAX_FRAMES) {
        return reply.code(400).send({
          error: "WorkloadTooLarge",
          message: `Workload would generate up to ${drainedTicks} frames; max allowed is ${MAX_FRAMES}.`,
        });
      }

      try {
        const result = runSimulation(
          input as Parameters<typeof runSimulation>[0],
          { deadlineMs: budgetMs },
        );
        reply.header(
          "Cache-Control",
          "public, max-age=60, stale-while-revalidate=600",
        );
        return result;
      } catch (err) {
        if (err instanceof SimulationTimeoutError) {
          request.log.warn(
            { budgetMs, nodes: input.diagram.nodes.length, edges: input.diagram.edges.length },
            "simulation timed out",
          );
          return reply.code(408).send({
            error: "SimulationTimeout",
            message:
              "This simulation took too long to run. Try a smaller diagram or fewer ticks.",
          });
        }
        throw err;
      }
    },
  );
};
