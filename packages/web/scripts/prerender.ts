/**
 * SEO prerender step — runs after `vite build`.
 *
 * This template's production server (`src/server.ts`) serves a single static
 * `index.html` shell for every route; all titles/meta/content are written by
 * React after JS executes (see `web/components/seo.tsx`). Search crawlers and
 * `curl` only see the raw HTML, so every page looked identical to them.
 *
 * This script serves the freshly built `dist/` on a throwaway local port,
 * drives a real headless browser to each public route, waits for the app to
 * render (same JS that runs for a real visitor), and snapshots the resulting
 * `document.documentElement.outerHTML`. Snapshots are written to
 * `dist/prerendered/*.html` plus a `manifest.json` mapping route -> file.
 * `src/server.ts` serves those snapshots for matching routes, then still
 * loads the same JS bundles so the page hydrates into the normal SPA.
 *
 * No content changes: each snapshot is literally what the browser would
 * render for that route after JS runs — this just captures it once at build
 * time so non-JS clients get the real HTML.
 */
import { chromium } from "playwright";
import { en } from "../src/web/i18n/en";

const DIST = new URL("../dist/", import.meta.url).pathname;
const PRERENDER_DIR = `${DIST}prerendered/`;

const STATIC_ROUTES = [
  "/",
  "/services",
  "/portfolio",
  "/insights",
  "/conferences-exhibitions",
  "/about",
  "/contact",
  "/business-card",
];

const SERVICE_ROUTES = en.services.items.map((s) => `/services/${s.slug}`);
const INSIGHT_ROUTES = en.insights.posts.map((p) => `/insights/${p.slug}`);

const ROUTES = [...STATIC_ROUTES, ...SERVICE_ROUTES, ...INSIGHT_ROUTES];

function routeToFileName(route: string): string {
  if (route === "/") return "index.html";
  return `${route.replace(/^\//, "").replace(/\//g, "__")}.html`;
}

async function serveDistOnce(): Promise<{ port: number; stop: () => void }> {
  const server = Bun.serve({
    port: 0,
    async fetch(request) {
      const url = new URL(request.url);
      const cleanPath = decodeURIComponent(url.pathname).replace(/^\/+/, "").replaceAll("..", "");
      const filePath = cleanPath ? `${DIST}${cleanPath}` : `${DIST}index.html`;
      const file = Bun.file(filePath);
      if (await file.exists()) {
        const stat = await file.stat?.();
        if (!stat || !stat.isDirectory?.()) return new Response(file);
      }
      const index = Bun.file(`${DIST}index.html`);
      return new Response(index, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    },
  });
  return { port: server.port, stop: () => server.stop(true) };
}

async function main() {
  console.log(`[prerender] ${ROUTES.length} routes to snapshot`);
  await Bun.$`mkdir -p ${PRERENDER_DIR}`.quiet();

  const { port, stop } = await serveDistOnce();
  const baseUrl = `http://localhost:${port}`;
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
  const manifest: Record<string, string> = {};

  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    for (const route of ROUTES) {
      const page = await context.newPage();
      try {
        await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 30_000 });
        // The Seo component writes <title>/meta/JSON-LD in a useEffect, which
        // runs after `networkidle` fires. Wait for its JSON-LD script tags to
        // actually exist in the DOM before snapshotting, instead of a fixed
        // delay that can race the effect on slower routes.
        await page.waitForFunction(
          () => document.getElementById("ld-organization") !== null,
          { timeout: 5_000 },
        );
        await page.waitForTimeout(100);
        const html = await page.evaluate(() => `<!doctype html>\n${document.documentElement.outerHTML}`);
        const fileName = routeToFileName(route);
        await Bun.write(`${PRERENDER_DIR}${fileName}`, html);
        manifest[route] = fileName;
        console.log(`[prerender] ok  ${route} -> prerendered/${fileName}`);
      } catch (err) {
        console.error(`[prerender] FAILED ${route}:`, err instanceof Error ? err.message : err);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    stop();
  }

  await Bun.write(`${PRERENDER_DIR}manifest.json`, JSON.stringify(manifest, null, 2));
  console.log(`[prerender] wrote manifest with ${Object.keys(manifest).length} entries`);
}

main().catch((err) => {
  console.error("[prerender] fatal:", err);
  process.exit(1);
});
