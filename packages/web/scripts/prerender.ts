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

/**
 * A snapshot is only useful for SEO if it actually carries the tags
 * search engines and `curl` need. Reject anything missing them instead of
 * writing a "successful" snapshot that is really just the bare SPA shell —
 * that silent failure mode is exactly what let two production deploys ship
 * with zero prerendered SEO content while this script reported nothing
 * wrong (it was never run at all; see the project .gitignore history), and
 * it is what this check now exists to make impossible to miss.
 */
function validateSnapshot(html: string): string[] {
  const problems: string[] = [];
  const titleMatch = /<title>([^<]*)<\/title>/.exec(html);
  if (!titleMatch || !titleMatch[1]?.trim()) problems.push("missing <title>");
  const h1Matches = html.match(/<h1[\s>]/g) ?? [];
  if (h1Matches.length === 0) problems.push("missing <h1>");
  if (h1Matches.length > 1) problems.push(`found ${h1Matches.length} <h1> elements, expected exactly 1`);
  if (!/rel="canonical"/.test(html)) problems.push('missing rel="canonical" link');
  if (!/name="description"/.test(html)) problems.push("missing meta description");
  if (!/name="robots"/.test(html)) problems.push("missing meta robots");
  if (!/property="og:title"/.test(html)) problems.push("missing og:title");
  if (!/hreflang=/.test(html)) problems.push("missing hreflang alternate link");
  const ldCount = (html.match(/application\/ld\+json/g) ?? []).length;
  if (ldCount === 0) problems.push("missing JSON-LD");
  return problems;
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
  let browser: Awaited<ReturnType<typeof chromium.launch>>;
  try {
    browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
  } catch (err) {
    // Fail the whole build immediately and loudly — a missing/unlaunchable
    // browser must never result in a build that "succeeds" with no SEO
    // content. No manifest is written, so a stale one from a previous build
    // can't be picked up by `dist/` either (dist is wiped by `vite build`).
    console.error("[prerender] FATAL: could not launch Chromium at /usr/bin/google-chrome.");
    console.error("[prerender] This build cannot ship without SEO prerendering. Failing the build.");
    console.error(err instanceof Error ? err.message : err);
    stop();
    process.exit(1);
  }

  const manifest: Record<string, string> = {};
  const failures: Record<string, string[]> = {};

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
        const problems = validateSnapshot(html);
        if (problems.length > 0) {
          failures[route] = problems;
          console.error(`[prerender] INVALID ${route}: ${problems.join("; ")}`);
          continue;
        }
        const fileName = routeToFileName(route);
        await Bun.write(`${PRERENDER_DIR}${fileName}`, html);
        manifest[route] = fileName;
        console.log(`[prerender] ok  ${route} -> prerendered/${fileName}`);
      } catch (err) {
        failures[route] = [err instanceof Error ? err.message : String(err)];
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
  console.log(`[prerender] wrote manifest with ${Object.keys(manifest).length}/${ROUTES.length} entries`);

  // A build that silently ships with some (or all) routes missing their SEO
  // content is the exact bug this whole script exists to prevent. Fail the
  // build hard instead of letting `server.ts` fall back to the bare SPA
  // shell for any route no one explicitly accepted as noindex/skipped.
  const missingRoutes = ROUTES.filter((route) => !manifest[route]);
  if (missingRoutes.length > 0) {
    console.error(`[prerender] FATAL: ${missingRoutes.length}/${ROUTES.length} route(s) failed to prerender:`);
    for (const route of missingRoutes) {
      console.error(`  - ${route}: ${(failures[route] ?? ["unknown error"]).join("; ")}`);
    }
    console.error("[prerender] Failing the build — fix the above before shipping.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[prerender] fatal:", err);
  process.exit(1);
});
