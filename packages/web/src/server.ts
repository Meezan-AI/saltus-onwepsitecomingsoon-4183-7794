// Deploy-compat entrypoint: the platform's release pipeline bundles
// packages/web/src/server.ts as the production server. The real sandbox
// preview server lives in the protected __server.ts (which pm2 runs here).
//
// This file additionally serves the build-time SEO prerendered HTML
// (see scripts/prerender.ts) for the public marketing routes, so Googlebot
// and `curl` get the same title/meta/content a real browser would render,
// instead of the one generic index.html shell every route used to share.
// Every other request (API, static assets, unknown paths) behaves exactly
// like `__server.ts`.
import app from "./api";

const port = Number(process.env.PORT ?? 3000);
const distDir = `${import.meta.dir}/../dist`;
const indexPath = `${distDir}/index.html`;
const prerenderDir = `${distDir}/prerendered`;

let manifest: Record<string, string> = {};
try {
  const raw = await Bun.file(`${prerenderDir}/manifest.json`).text();
  manifest = JSON.parse(raw);
} catch {
  // No prerendered snapshots yet (e.g. local dev build without the
  // prerender step) — fall back to the plain SPA shell for every route.
  manifest = {};
}

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname || "/";
}

function getStaticFilePath(pathname: string) {
  const cleanPath = decodeURIComponent(pathname).replace(/^\/+/, "").replaceAll("..", "");
  return cleanPath ? `${distDir}/${cleanPath}` : indexPath;
}

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api")) {
      return app.fetch(request);
    }

    if (request.method === "GET" || request.method === "HEAD") {
      const route = normalizePathname(url.pathname);
      const prerenderedFile = manifest[route];
      if (prerenderedFile) {
        const file = Bun.file(`${prerenderDir}/${prerenderedFile}`);
        if (await file.exists()) {
          return new Response(file, { headers: { "Content-Type": "text/html; charset=utf-8" } });
        }
      }
    }

    const filePath = getStaticFilePath(url.pathname);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file);
    }

    const index = Bun.file(indexPath);
    if (await index.exists()) {
      return new Response(index, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Build output not found. Run `bun run build` first.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
});

console.log(`Web server listening on http://localhost:${server.port} (${Object.keys(manifest).length} prerendered routes)`);
