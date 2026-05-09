/**
 * Fastify application factory. Exported separately from the bootstrap
 * (`server.ts`) so tests can spin the app up in-process without binding a
 * real port via `app.inject()`.
 */
import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import compress from "@fastify/compress";
import rateLimit from "@fastify/rate-limit";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { simulateRoute } from "./routes/simulate";

export interface BuildAppOptions {
  /** Origins allowed by CORS. Defaults to localhost dev origins. */
  corsOrigins?: string[];
  /** Disable @fastify/rate-limit (handy for tests). */
  disableRateLimit?: boolean;
}

export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV === "test" ? false : true,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, {
    origin: opts.corsOrigins ?? ["http://localhost:3000"],
    methods: ["GET", "POST"],
  });

  await app.register(compress, { global: true, threshold: 1024 });

  if (!opts.disableRateLimit) {
    await app.register(rateLimit, {
      max: 60,
      timeWindow: "1 minute",
    });
  }

  app.get("/healthz", async () => ({ status: "ok", version: "0.1.0" }));

  await app.register(simulateRoute);

  return app;
}
