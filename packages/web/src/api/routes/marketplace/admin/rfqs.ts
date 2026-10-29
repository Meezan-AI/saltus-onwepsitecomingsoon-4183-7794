import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { adminOnly } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";

/** Admin side of the RFQ lifecycle — report section 7. */
export const rfqs = {
  list: adminOnly
    .input(z.object({ status: z.enum(["new", "quoted", "accepted", "declined", "expired"]).optional() }))
    .handler(({ input }) =>
      db
        .select()
        .from(schema.rfqRequests)
        .where(input.status ? eq(schema.rfqRequests.status, input.status) : undefined)
        .orderBy(desc(schema.rfqRequests.id)),
    ),

  get: adminOnly.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    const [request] = await db.select().from(schema.rfqRequests).where(eq(schema.rfqRequests.id, input.id));
    if (!request) throw new ORPCError("NOT_FOUND");
    const [product, customer] = await Promise.all([
      db.select().from(schema.products).where(eq(schema.products.id, request.productId)),
      db.select().from(schema.user).where(eq(schema.user.id, request.userId)),
    ]);
    return { ...request, product: product[0] ?? null, customer: customer[0] ?? null };
  }),

  quote: adminOnly
    .input(z.object({ id: z.number(), quotedPriceCents: z.number().int().min(0), validUntil: z.coerce.date() }))
    .handler(async ({ context, input }) => {
      const [request] = await db
        .update(schema.rfqRequests)
        .set({
          status: "quoted",
          quotedPriceCents: input.quotedPriceCents,
          quotedBy: context.user.id,
          quotedAt: new Date(),
          validUntil: input.validUntil,
        })
        .where(eq(schema.rfqRequests.id, input.id))
        .returning();
      if (!request) throw new ORPCError("NOT_FOUND");
      return request;
    }),

  decline: adminOnly.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    const [request] = await db
      .update(schema.rfqRequests)
      .set({ status: "declined" })
      .where(eq(schema.rfqRequests.id, input.id))
      .returning();
    if (!request) throw new ORPCError("NOT_FOUND");
    return request;
  }),
};
