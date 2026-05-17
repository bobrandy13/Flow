import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app";

describe("CORS", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({
      disableRateLimit: true,
      allowLocalhost: true,
      corsOrigins: ["https://learnsystemdesign.net"],
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ])("allows local web dev origin %s to preflight the API", async (origin) => {
    const res = await app.inject({
      method: "OPTIONS",
      url: "/api/simulate",
      headers: {
        origin,
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
    });

    expect(res.statusCode).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(origin);
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
    expect(res.headers["access-control-allow-headers"]).toContain("content-type");
  });

  it("allows local web dev origin on the actual simulation request", async () => {
    const origin = "http://localhost:3000";
    const res = await app.inject({
      method: "POST",
      url: "/api/simulate",
      headers: { origin },
      payload: {
        diagram: {
          nodes: [
            { id: "c", kind: "client", position: { x: 0, y: 0 } },
            { id: "s", kind: "server", position: { x: 100, y: 0 } },
          ],
          edges: [{ id: "e1", fromNodeId: "c", toNodeId: "s" }],
        },
        workload: { requestsPerTick: 1, ticks: 10 },
        sla: { minSuccessRate: 0.9, maxP95Latency: 100 },
        seed: 1,
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(origin);
  });
});

describe("CORS in production", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({
      disableRateLimit: true,
      allowLocalhost: false,
      corsOrigins: ["https://learnsystemdesign.net"],
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    "https://evil.run.app",
    "https://attacker.example.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ])("rejects untrusted origin %s when localhost is disabled", async (origin) => {
    const res = await app.inject({
      method: "OPTIONS",
      url: "/api/simulate",
      headers: {
        origin,
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
    });

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("still allows the explicit production origin", async () => {
    const origin = "https://learnsystemdesign.net";
    const res = await app.inject({
      method: "OPTIONS",
      url: "/api/simulate",
      headers: {
        origin,
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
    });

    expect(res.statusCode).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(origin);
  });
});
