// Test-only helpers — never imported by app code, only by *.test.ts files.
// Builds a throwaway, fully-migrated SQLite DB per test file so tests never
// touch the real (shared, production-pointed) Turso DB that `./__client.ts`
// connects to.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";

const migrationsFolder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../drizzle");

/**
 * Creates a fresh in-memory SQLite DB and runs every migration in
 * `./drizzle` against it (same files applied to the real DB), including the
 * 0002 RBAC seed — so a test DB starts with the real `permissions`/`roles`
 * catalog already in place, exactly like production after this phase ships.
 */
export async function createTestDb() {
  const client = createClient({ url: ":memory:" });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  return { db, client };
}

let counter = 0;
/** Unique-enough id/email for a throwaway `user` row within one test file. */
function nextId(prefix: string) {
  counter += 1;
  return `${prefix}-${counter}`;
}

/** Inserts a minimal `user` row (better-auth's table) and returns it. */
export async function seedUser(
  db: Awaited<ReturnType<typeof createTestDb>>["db"],
  overrides: Partial<{ id: string; name: string; email: string; role: string }> = {},
) {
  const id = overrides.id ?? nextId("user");
  const [row] = await db
    .insert(schema.user)
    .values({
      id,
      name: overrides.name ?? "Test User",
      email: overrides.email ?? `${id}@example.test`,
      role: overrides.role ?? "customer",
    })
    .returning();
  return row;
}

/** Inserts a minimal `products` row and returns it. */
export async function seedProduct(
  db: Awaited<ReturnType<typeof createTestDb>>["db"],
  overrides: Partial<{ sku: string; slug: string; nameEn: string; nameAr: string; type: string }> = {},
) {
  const id = nextId("product");
  const [row] = await db
    .insert(schema.products)
    .values({
      sku: overrides.sku ?? `SKU-${id}`,
      slug: overrides.slug ?? `slug-${id}`,
      nameEn: overrides.nameEn ?? "Test Product",
      nameAr: overrides.nameAr ?? "منتج تجريبي",
      type: overrides.type ?? "other",
    })
    .returning();
  return row;
}

/** Inserts a minimal `orders` row owned by `userId` and returns it. */
export async function seedOrder(
  db: Awaited<ReturnType<typeof createTestDb>>["db"],
  userId: string,
  overrides: Partial<{ status: string; fulfillmentType: string; subtotalCents: number; totalCents: number }> = {},
) {
  const id = nextId("order");
  const [row] = await db
    .insert(schema.orders)
    .values({
      orderNumber: `ORD-${id}`,
      userId,
      fulfillmentType: overrides.fulfillmentType ?? "delivery",
      status: overrides.status ?? "design_pending",
      subtotalCents: overrides.subtotalCents ?? 10000,
      totalCents: overrides.totalCents ?? 10000,
    })
    .returning();
  return row;
}
