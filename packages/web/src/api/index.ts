import type { RouterClient } from "@orpc/server";
import { createApp } from "./__core/app";
import { auth } from "./auth";
import { leads } from "./routes/leads";
import { ping } from "./routes/ping";
import { account } from "./routes/marketplace/account";
import { addresses } from "./routes/marketplace/addresses";
import { admin } from "./routes/marketplace/admin";
import { cart } from "./routes/marketplace/cart";
import { catalog } from "./routes/marketplace/catalog";
import { designs } from "./routes/marketplace/designs";
import { orders } from "./routes/marketplace/orders";
import { rfq } from "./routes/marketplace/rfq";
import { uploads } from "./routes/marketplace/uploads";

// API features are oRPC procedures, one file per feature in ./routes/,
// composed into this router — typed end-to-end via the clients
// (web: src/web/lib/api.ts, mobile: lib/api.ts).
// Keep each routes/ file under 500 lines (`bun run lint` enforces this);
// split into more feature files as they grow.
// Patterns and examples: skills/app/references/api.md
export const router = {
  ping,
  leads,
  account,
  catalog,
  cart,
  orders,
  rfq,
  designs,
  addresses,
  uploads,
  admin,
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);
// Rare plain-HTTP endpoints (webhooks, streaming, the Better Auth handler)
// register here with full paths, e.g. app.post("/api/webhooks/example", ...)
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

export default app;
