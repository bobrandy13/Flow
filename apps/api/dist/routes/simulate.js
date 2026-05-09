import { simulationInputSchema, MAX_FRAMES, } from "@flow/shared/schemas/sim";
import { runSimulation } from "@flow/shared/simulation/run";
export const simulateRoute = async (fastify) => {
    fastify.withTypeProvider().post("/api/simulate", {
        schema: {
            body: simulationInputSchema,
        },
    }, async (request, reply) => {
        const input = request.body;
        // Catch oversized workloads BEFORE running the simulator. The drain
        // horizon mirrors the simulator's internal `maxTicks` formula.
        const drainedTicks = input.workload.ticks * 4 + 200;
        if (drainedTicks > MAX_FRAMES) {
            return reply.code(400).send({
                error: "WorkloadTooLarge",
                message: `Workload would generate up to ${drainedTicks} frames; max allowed is ${MAX_FRAMES}.`,
            });
        }
        const result = runSimulation(input);
        reply.header("Cache-Control", "public, max-age=60, stale-while-revalidate=600");
        return result;
    });
};
