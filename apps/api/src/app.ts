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
  /**
   * When set, every request (except `/healthz`) must carry an
   * `x-origin-secret` header equal to this value or it is rejected with 403.
   * Cloudflare injects the header via a Transform Rule; direct hits to the
   * public Cloud Run URL lack it and are turned away. Leave undefined when the
   * origin is locked at the network layer instead (e.g. a Cloudflare Tunnel).
   */
  originSharedSecret?: string;
}

/**
 * Header Cloudflare sets to the true client IP. Cloudflare overwrites any
 * client-supplied value, so — provided the origin only accepts Cloudflare
 * traffic (see `originSharedSecret`) — it cannot be forged. We key the rate
 * limiter on this rather than `request.ip`, because `request.ip` is derived
 * from a client-controllable `X-Forwarded-For` and would let an attacker mint
 * a fresh bucket per request by rotating the header.
 */
const CF_CLIENT_IP_HEADER = "cf-connecting-ip";

/** Max request body. Largest valid simulation body is well under 32KB. */
const MAX_BODY_BYTES = 64 * 1024;

export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const isProd = process.env.NODE_ENV === "production";
  const allowLocalhost = opts.allowLocalhost ?? !isProd;

  const app = Fastify({
    logger: process.env.NODE_ENV === "test" ? false : true,
    // We sit behind Cloudflare → Google Cloud Run. `trustProxy` makes
    // `request.ip`/logs reflect the forwarding chain. NOTE: with `true`,
    // `request.ip` is taken from the (client-spoofable) leftmost
    // `X-Forwarded-For` entry, so it must NOT be used as a security
    // boundary. Rate limiting keys on `CF-Connecting-IP` instead (below).
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

  // Origin guard: reject any request that didn't come through Cloudflare.
  // Cloudflare injects `x-origin-secret`; direct hits to the public Cloud Run
  // URL lack it. `/healthz` is exempt — Cloud Run's own liveness/startup
  // probes reach the container directly, not via Cloudflare.
  const originSharedSecret = opts.originSharedSecret;
  if (originSharedSecret) {
    app.addHook("onRequest", async (request, reply) => {
      if (request.url === "/healthz") return;
      if (request.headers["x-origin-secret"] !== originSharedSecret) {
        return reply.code(403).send({
          error: "Forbidden",
          message: "Request must be routed through the public endpoint.",
        });
      }
    });
  }

  if (!opts.disableRateLimit) {
    await app.register(rateLimit, {
      max: 60,
      timeWindow: "1 minute",
      // Key on the Cloudflare-supplied client IP (unforgeable once the origin
      // only accepts Cloudflare traffic). Fall back to `request.ip` so the
      // limiter still functions in local/dev where the header is absent.
      keyGenerator: (request) => {
        const cfIp = request.headers[CF_CLIENT_IP_HEADER];
        if (typeof cfIp === "string" && cfIp.length > 0) return cfIp;
        return request.ip;
      },
    });
  }

  app.get("/healthz", async () => ({ status: "ok", version: "0.1.0" }));

  await app.register(simulateRoute, {
    simulationBudgetMs: opts.simulationBudgetMs ?? 2000,
  });

  return app;
}
