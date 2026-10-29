import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { authed } from "../../middleware/auth";
import { db } from "../../database";
import * as schema from "../../database/schema";

const addressInput = z.object({
  label: z.string().max(60).optional(),
  recipientName: z.string().min(2).max(120),
  phone: z.string().min(6).max(40),
  city: z.string().min(2).max(80),
  addressLine1: z.string().min(2).max(200),
  addressLine2: z.string().max(200).optional(),
  isDefault: z.boolean().optional(),
});

/** Customer's own delivery addresses — report section 1/3 (checkout + account pages). */
export const addresses = {
  list: authed.handler(({ context }) =>
    db.select().from(schema.addresses).where(eq(schema.addresses.userId, context.user.id)),
  ),

  create: authed.input(addressInput).handler(async ({ context, input }) => {
    if (input.isDefault) {
      await db
        .update(schema.addresses)
        .set({ isDefault: false })
        .where(eq(schema.addresses.userId, context.user.id));
    }
    const [address] = await db
      .insert(schema.addresses)
      .values({ ...input, userId: context.user.id })
      .returning();
    return address;
  }),

  update: authed
    .input(addressInput.partial().extend({ id: z.number() }))
    .handler(async ({ context, input }) => {
      const { id, ...rest } = input;
      const [existing] = await db
        .select()
        .from(schema.addresses)
        .where(and(eq(schema.addresses.id, id), eq(schema.addresses.userId, context.user.id)));
      if (!existing) throw new ORPCError("NOT_FOUND");

      if (rest.isDefault) {
        await db
          .update(schema.addresses)
          .set({ isDefault: false })
          .where(eq(schema.addresses.userId, context.user.id));
      }
      const [updated] = await db
        .update(schema.addresses)
        .set(rest)
        .where(eq(schema.addresses.id, id))
        .returning();
      return updated;
    }),

  delete: authed.input(z.object({ id: z.number() })).handler(async ({ context, input }) => {
    const [existing] = await db
      .select()
      .from(schema.addresses)
      .where(and(eq(schema.addresses.id, input.id), eq(schema.addresses.userId, context.user.id)));
    if (!existing) throw new ORPCError("NOT_FOUND");
    await db.delete(schema.addresses).where(eq(schema.addresses.id, input.id));
    return { ok: true };
  }),
};
