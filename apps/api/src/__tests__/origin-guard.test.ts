import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app";

const SECRET = "test-origin-secret";

const validInput = () => ({
  diagram: {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "s", kind: "server", position: { x: 100, y: 0 } },
    ],
    edges: [{ id: "e1", fromNodeId: "c", toNodeId: "s" }],
  },
  workload: { requestsPerTick: 1, ticks: 5 },
  sla: { minSuccessRate: 0.9, maxP95Latency: 100 },
  seed: 1,
});

describe("origin shared-secret guard", () => {
  let app: FastifyInstance;
  afterEach(async () => {
    await app?.close();
  });

  it("rejects a request with no x-origin-secret header (403)", async () => {
    app = await buildApp({
      disableRateLimit: true,
      allowLocalhost: true,
      originSharedSecret: SECRET,
    });
    await app.ready();

    const res = await app.inject({
      method: "POST",
      url: "/api/simulate",
      payload: validInput(),
    });
    expect(res.statusCode).toBe(403);
  });

  it("rejects a request with the wrong secret (403)", async () => {
    app = await buildApp({
      disableRateLimit: true,
      allowLocalhost: true,
      originSharedSecret: SECRET,
    });
    await app.ready();

    const res = await app.inject({
      method: "POST",
      url: "/api/simulate",
      headers: { "x-origin-secret": "wrong" },
      payload: validInput(),
    });
    expect(res.statusCode).toBe(403);
  });

  it("allows /healthz without the secret (Cloud Run probes hit it directly)", async () => {
    app = await buildApp({
      disableRateLimit: true,
      allowLocalhost: true,
      originSharedSecret: SECRET,
    });
    await app.ready();

    const res = await app.inject({ method: "GET", url: "/healthz" });
    expect(res.statusCode).toBe(200);
  });

  it("allows a request carrying the correct secret", async () => {
    app = await buildApp({
      disableRateLimit: true,
      allowLocalhost: true,
      originSharedSecret: SECRET,
    });
    await app.ready();

    const res = await app.inject({
      method: "POST",
      url: "/api/simulate",
      headers: { "x-origin-secret": SECRET },
      payload: validInput(),
    });
    expect(res.statusCode).toBe(200);
  });

  it("does not enforce the guard when no secret is configured (tunnel mode)", async () => {
    app = await buildApp({ disableRateLimit: true, allowLocalhost: true });
    await app.ready();

    const res = await app.inject({
      method: "POST",
      url: "/api/simulate",
      payload: validInput(),
    });
    expect(res.statusCode).toBe(200);
  });
});

describe("rate limit keys on CF-Connecting-IP, not spoofable X-Forwarded-For", () => {
  let app: FastifyInstance;
  afterEach(async () => {
    await app?.close();
  });

  // The limiter is 60/min. We fire 65 cheap /healthz requests per scenario and
  // assert on whether the 429 appears, proving which header forms the key.
  const BURST = 65;

  it("throttles a single client (same CF-Connecting-IP) after the cap", async () => {
    app = await buildApp({ allowLocalhost: true });
    await app.ready();

    let saw429 = false;
    for (let i = 0; i < BURST; i++) {
      const res = await app.inject({
        method: "GET",
        url: "/healthz",
        headers: { "cf-connecting-ip": "203.0.113.7" },
      });
      if (res.statusCode === 429) saw429 = true;
    }
    expect(saw429).toBe(true);
  });

  it("does NOT throttle when CF-Connecting-IP differs per request", async () => {
    app = await buildApp({ allowLocalhost: true });
    await app.ready();

    let saw429 = false;
    for (let i = 0; i < BURST; i++) {
      const res = await app.inject({
        method: "GET",
        url: "/healthz",
        headers: { "cf-connecting-ip": `198.51.100.${i}` },
      });
      if (res.statusCode === 429) saw429 = true;
    }
    expect(saw429).toBe(false);
  });

  it("cannot be bypassed by rotating X-Forwarded-For while CF-Connecting-IP is fixed", async () => {
    app = await buildApp({ allowLocalhost: true });
    await app.ready();

    let saw429 = false;
    for (let i = 0; i < BURST; i++) {
      const res = await app.inject({
        method: "GET",
        url: "/healthz",
        headers: {
          "cf-connecting-ip": "203.0.113.42",
          // Attacker rotates XFF every request hoping for a fresh bucket.
          "x-forwarded-for": `10.0.0.${i}`,
        },
      });
      if (res.statusCode === 429) saw429 = true;
    }
    expect(saw429).toBe(true);
  });
});
