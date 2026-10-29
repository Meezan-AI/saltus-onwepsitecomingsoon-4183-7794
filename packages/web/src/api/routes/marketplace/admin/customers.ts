import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { adminOnly } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";

/** Registered customers and their order history — report section 4 (/admin/customers). */
export const customers = {
  list: adminOnly.handler(() =>
    db.select().from(schema.user).where(eq(schema.user.role, "customer")).orderBy(desc(schema.user.createdAt)),
  ),

  orders: adminOnly.input(z.object({ userId: z.string() })).handler(({ input }) =>
    db.select().from(schema.orders).where(eq(schema.orders.userId, input.userId)).orderBy(desc(schema.orders.id)),
  ),
};
