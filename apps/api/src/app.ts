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

  // Default: allow any localhost / 127.0.0.1 origin in dev so port shuffling
  // (e.g. Next falling back to :3001 when :3000 is busy) doesn't break the
  // app. In prod, override via CORS_ORIGINS env.
  const allowedOrigins = opts.corsOrigins;
  await app.register(cors, {
    origin: allowedOrigins
      ? allowedOrigins
      : (origin, cb) => {
          if (!origin) return cb(null, true); // same-origin / curl
          try {
            const url = new URL(origin);
            const isLocalhost =
              url.hostname === "localhost" || url.hostname === "127.0.0.1";
            return cb(null, isLocalhost);
          } catch {
            return cb(null, false);
          }
        },
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
