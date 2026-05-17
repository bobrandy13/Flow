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
  /** Explicit origins allowed by CORS. Required in production. */
  corsOrigins?: string[];
  /** Disable @fastify/rate-limit (handy for tests). */
  disableRateLimit?: boolean;
  /**
   * When true, also accept `http://localhost:*` and `http://127.0.0.1:*`
   * origins. Auto-enabled in development/test. Never enable in production.
   */
  allowLocalhost?: boolean;
  /**
   * Wall-clock CPU budget (ms) for a single `/api/simulate` request. Defaults
   * to 2000ms. Requests that exceed this return 408.
   */
  simulationBudgetMs?: number;
}

/** Max request body. Largest valid simulation body is well under 32KB. */
const MAX_BODY_BYTES = 64 * 1024;

export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const isProd = process.env.NODE_ENV === "production";
  const allowLocalhost = opts.allowLocalhost ?? !isProd;

  const app = Fastify({
    logger: process.env.NODE_ENV === "test" ? false : true,
    // We sit behind Cloudflare → Google Cloud Run. Both add trustworthy
    // forwarding headers; without this, `request.ip` is the LB and every
    // visitor shares one rate-limit bucket.
    trustProxy: true,
    bodyLimit: MAX_BODY_BYTES,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  const allowedOrigins = opts.corsOrigins ?? [];
  await app.register(cors, {
    origin: (origin, cb) => {
      // No Origin header: same-origin, curl, server-to-server. Allow in dev
      // for convenience; reject in production where browsers always send it.
      if (!origin) return cb(null, allowLocalhost);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (allowLocalhost) {
        try {
          const url = new URL(origin);
          if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
            return cb(null, true);
          }
        } catch {
          return cb(null, false);
        }
      }
      return cb(null, false);
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

  await app.register(simulateRoute, {
    simulationBudgetMs: opts.simulationBudgetMs ?? 2000,
  });

  return app;
}
