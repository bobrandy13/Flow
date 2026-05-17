import { expect, test, type Page } from "@playwright/test";

const runtimeFailurePatterns = [
  /Maximum update depth exceeded/i,
  /A tree hydrated but some attributes of the server rendered HTML didn't match/i,
  /Hydration failed/i,
];

function collectRuntimeFailures(page: Page) {
  const failures: string[] = [];
  const record = (message: string) => {
    if (runtimeFailurePatterns.some((pattern) => pattern.test(message))) {
      failures.push(message);
    }
  };

  page.on("console", (message) => {
    if (message.type() === "error") {
      record(message.text());
    }
  });
  page.on("pageerror", (error) => record(error.message));

  return failures;
}

async function addNode(page: Page, name: RegExp) {
  const btn = page.getByRole("button", { name });
  if (await btn.count()) {
    await btn.first().click();
  }
}

test("play page does not emit hydration or React update-loop errors", async ({ page }) => {
  const runtimeFailures = collectRuntimeFailures(page);

  await page.goto("/levels/05-smooth-the-burst/play");
  await expect(page.getByRole("heading", { name: /smooth the burst/i })).toBeVisible();
  await expect(page.locator("button", { hasText: "RUN SIMULATION" })).toBeVisible();

  await page.getByRole("button", { name: /^add client/i }).click();
  await page.getByRole("button", { name: /^add load balancer/i }).click();
  await page.getByRole("button", { name: /^add server/i }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(3);

  await page.waitForTimeout(500);
  expect(runtimeFailures).toEqual([]);
});

test("selecting, deselecting, and re-selecting nodes does not loop", async ({ page }) => {
  const runtimeFailures = collectRuntimeFailures(page);

  await page.goto("/levels/02-add-a-database/play");
  await expect(page.locator("button", { hasText: "RUN SIMULATION" })).toBeVisible();

  await addNode(page, /^add client/i);
  await addNode(page, /^add server/i);
  await addNode(page, /^add database/i);
  await expect(page.locator(".react-flow__node")).toHaveCount(3);

  const nodes = page.locator(".react-flow__node");
  const count = await nodes.count();

  // Click each node in order, then in reverse, then again. Selection ping-pong
  // is the main suspect for setState loops in the canvas.
  for (let i = 0; i < count; i++) await nodes.nth(i).click({ force: true });
  for (let i = count - 1; i >= 0; i--) await nodes.nth(i).click({ force: true });
  for (let i = 0; i < count; i++) await nodes.nth(i).click({ force: true });

  // Deselect by clicking empty canvas (avoid the minimap in the bottom-right).
  await page.locator(".react-flow__pane").click({ position: { x: 200, y: 200 }, force: true });

  await page.waitForTimeout(400);
  expect(runtimeFailures).toEqual([]);
});

test("replica controls and region selector do not loop", async ({ page }) => {
  const runtimeFailures = collectRuntimeFailures(page);

  // Level 10 allows database replication; level 02 caps databases at 1 and
  // should show the disabled-replica state. Exercise both.
  await page.goto("/levels/10-replicate-and-failover/play");
  await expect(page.locator("button", { hasText: "RUN SIMULATION" })).toBeVisible();

  await addNode(page, /^add client/i);
  await addNode(page, /^add server/i);
  await addNode(page, /^add database/i);
  await expect(page.locator(".react-flow__node")).toHaveCount(3);

  // Select the database (last node added) and replicate twice.
  await page.locator(".react-flow__node").last().click({ force: true });
  for (let i = 0; i < 2; i++) {
    const replicate = page.getByRole("button", { name: /replicate|add replica/i });
    if (await replicate.count()) {
      await replicate.first().click({ force: true });
      await page.waitForTimeout(150);
    }
  }

  // Re-select primary and change region.
  await page.locator(".react-flow__node").first().click({ force: true });
  const regionSel = page.getByLabel("Region");
  if (await regionSel.count()) {
    await regionSel.selectOption({ index: 1 });
    await page.waitForTimeout(150);
    await regionSel.selectOption("");
  }

  // Ungroup the replica group.
  await page.locator(".react-flow__node").last().click({ force: true });
  const ungroup = page.getByRole("button", { name: /ungroup/i });
  if (await ungroup.count()) {
    await ungroup.first().click({ force: true });
  }

  await page.waitForTimeout(400);
  expect(runtimeFailures).toEqual([]);
});

test("running a simulation while interacting does not loop", async ({ page }) => {
  const runtimeFailures = collectRuntimeFailures(page);

  await page.goto("/levels/01-hello-server/play");
  await expect(page.locator("button", { hasText: "RUN SIMULATION" })).toBeVisible();

  await addNode(page, /^add client/i);
  await addNode(page, /^add server/i);
  await expect(page.locator(".react-flow__node")).toHaveCount(2);

  // Connect client → server via drag from source handle to target handle.
  const client = page.locator(".react-flow__node").first();
  const server = page.locator(".react-flow__node").last();
  const cb = await client.boundingBox();
  const sb = await server.boundingBox();
  if (cb && sb) {
    await page.mouse.move(cb.x + cb.width - 2, cb.y + cb.height / 2);
    await page.mouse.down();
    await page.mouse.move(sb.x + 2, sb.y + sb.height / 2, { steps: 15 });
    await page.mouse.up();
  }

  const run = page.locator("button", { hasText: "RUN SIMULATION" });
  if (await run.isEnabled()) {
    await run.click();
    // Click nodes mid-simulation — selection changes while live frames stream.
    for (let i = 0; i < 4; i++) {
      await page.locator(".react-flow__node").nth(i % 2).click({ force: true });
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(1500);
  }

  expect(runtimeFailures).toEqual([]);
});
