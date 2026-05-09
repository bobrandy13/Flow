import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../app";
import type { FastifyInstance } from "fastify";

const validInput = () => ({
  diagram: {
    nodes: [
      { id: "c", kind: "client", position: { x: 0, y: 0 } },
      { id: "s", kind: "server", position: { x: 100, y: 0 } },
    ],
    edges: [{ id: "e1", fromNodeId: "c", toNodeId: "s" }],
  },
  workload: { requestsPerTick: 5, ticks: 50 },
  sla: { minSuccessRate: 0.9, maxP95Latency: 100 },
  seed: 1,
});

describe("POST /api/simulate", () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    app = await buildApp({ disableRateLimit: true, corsOrigins: ["*"] });
    await app.ready();
  });
  afterAll(async () => {
    await app.close();
  });

  it("returns frames + outcome on a valid request", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/simulate",
      payload: validInput(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { frames: unknown[]; outcome: { passed: boolean } };
    expect(Array.isArray(body.frames)).toBe(true);
    expect(body.frames.length).toBeGreaterThan(0);
    expect(typeof body.outcome.passed).toBe("boolean");
  });

  it("rejects malformed input with 400", async () => {
    const bad = validInput() as unknown as Record<string, unknown> & {
      diagram: { nodes: { kind: string }[] };
    };
    bad.diagram.nodes[0].kind = "totally_made_up";
    const res = await app.inject({
      method: "POST",
      url: "/api/simulate",
      payload: bad,
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects oversized workloads with 400 (WorkloadTooLarge)", async () => {
    const big = validInput();
    big.workload.ticks = 2000; // 2000 * 4 + 200 = 8200 > MAX_FRAMES (5000)
    const res = await app.inject({
      method: "POST",
      url: "/api/simulate",
      payload: big,
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: "WorkloadTooLarge" });
  });

  it("is deterministic: same input → byte-identical body", async () => {
    const input = validInput();
    const a = await app.inject({ method: "POST", url: "/api/simulate", payload: input });
    const b = await app.inject({ method: "POST", url: "/api/simulate", payload: input });
    expect(a.statusCode).toBe(200);
    expect(b.statusCode).toBe(200);
    expect(a.body).toBe(b.body);
  });

  it("sets Cache-Control on success", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/simulate",
      payload: validInput(),
    });
    expect(res.headers["cache-control"]).toMatch(/max-age=\d+/);
  });

  it("payload size for a typical level stays under 500KB", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/simulate",
      payload: validInput(),
    });
    const sizeKb = Buffer.byteLength(res.body) / 1024;
    expect(sizeKb).toBeLessThan(500);
  });
});

describe("GET /healthz", () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    app = await buildApp({ disableRateLimit: true });
    await app.ready();
  });
  afterAll(async () => {
    await app.close();
  });

  it("returns 200 with status:ok", async () => {
    const res = await app.inject({ method: "GET", url: "/healthz" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: "ok" });
  });
});
