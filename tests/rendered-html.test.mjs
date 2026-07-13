import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the market rotation dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Sector Rotation Monitor \| Market Intelligence<\/title>/i);
  assert.match(html, /Sector Rotation Monitor/i);
  assert.doesNotMatch(html, /See leadership shift/i);
  assert.match(html, /What&#x27;s moving/i);
  assert.match(html, /Complete portfolio/i);
  assert.match(html, /11 SPDR sector funds/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("ships the live snapshot route and removes the starter preview", async () => {
  const [route, page, layout] = await Promise.all([
    readFile(new URL("../app/api/market/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(route, /stocks\/snapshots/);
  assert.match(route, /APCA-API-KEY-ID/);
  assert.match(route, /provider: "demo"/);
  assert.match(page, /MarketDashboard/);
  assert.match(layout, /Sector Rotation Monitor/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});

test("keeps daily holdings diagnostics transparent but out of the data flow", async () => {
  const [dashboard, snapshotSource, workflow] = await Promise.all([
    readFile(new URL("../app/MarketDashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/holdings-snapshot.ts", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/refresh-spdr-holdings.yml", import.meta.url), "utf8"),
  ]);
  assert.match(snapshotSource, /cache: "no-store"/);
  assert.doesNotMatch(dashboard, /window\.setInterval\(refresh, 15 \* 60_000\)/);
  assert.match(dashboard, /Prices updated/);
  assert.match(dashboard, /<span>Updated<\/span><strong>\{formatCheckedTime\(issuerHoldings\?\.fetchedAt\)\}<\/strong>/);
  assert.ok(dashboard.indexOf('<div className="holdings-provenance">') > dashboard.indexOf('<div className="holdings-list">'));
  assert.doesNotMatch(dashboard, /<span>Updated \{formatTime\(asOf\)\}/);
  assert.doesNotMatch(workflow, /cron: "15 14 \* \* 1-5"/);
  assert.match(workflow, /cron: "30 23 \* \* 1-5"/);
});
