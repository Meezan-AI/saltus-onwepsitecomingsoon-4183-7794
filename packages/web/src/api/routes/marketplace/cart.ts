import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { authed } from "../../middleware/auth";
import { db } from "../../database";
import * as schema from "../../database/schema";

async function getOrCreateCart(userId: string) {
  const [existing] = await db.select().from(schema.carts).where(eq(schema.carts.userId, userId));
  if (existing) return existing;
  const [created] = await db.insert(schema.carts).values({ userId }).returning();
  return created;
}

async function cartWithItems(cartId: number) {
  const items = await db
    .select({
      id: schema.cartItems.id,
      productId: schema.cartItems.productId,
      variantId: schema.cartItems.variantId,
      qty: schema.cartItems.qty,
      product: schema.products,
      variant: schema.productVariants,
    })
    .from(schema.cartItems)
    .innerJoin(schema.products, eq(schema.cartItems.productId, schema.products.id))
    .leftJoin(schema.productVariants, eq(schema.cartItems.variantId, schema.productVariants.id))
    .where(eq(schema.cartItems.cartId, cartId));

  return { id: cartId, items };
}

/** One cart per customer — report section 3/6 (storefront cart + checkout lead-in). */
export const cart = {
  get: authed.handler(async ({ context }) => {
    const myCart = await getOrCreateCart(context.user.id);
    return cartWithItems(myCart.id);
  }),

  // `variantId` is required: every direct-purchase product must have at least one
  // priced variant (e.g. a single "Standard" option) — price always comes from
  // the variant, never the product row.
  addItem: authed
    .input(z.object({ productId: z.number(), variantId: z.number(), qty: z.number().int().min(1).default(1) }))
    .handler(async ({ context, input }) => {
      const [product] = await db.select().from(schema.products).where(eq(schema.products.id, input.productId));
      if (!product || !product.isActive) throw new ORPCError("NOT_FOUND", { message: "Product not found" });
      if (!product.allowDirectPurchase) {
        throw new ORPCError("BAD_REQUEST", { message: "This product is request-a-quote only" });
      }
      const [variant] = await db
        .select()
        .from(schema.productVariants)
        .where(and(eq(schema.productVariants.id, input.variantId), eq(schema.productVariants.productId, input.productId)));
      if (!variant || !variant.isActive) throw new ORPCError("NOT_FOUND", { message: "Variant not found" });

      const myCart = await getOrCreateCart(context.user.id);
      const sameProduct = await db
        .select()
        .from(schema.cartItems)
        .where(and(eq(schema.cartItems.cartId, myCart.id), eq(schema.cartItems.productId, input.productId)));
      const existing = sameProduct.find((row) => row.variantId === input.variantId);

      if (existing) {
        await db
          .update(schema.cartItems)
          .set({ qty: existing.qty + input.qty })
          .where(eq(schema.cartItems.id, existing.id));
      } else {
        await db.insert(schema.cartItems).values({
          cartId: myCart.id,
          productId: input.productId,
          variantId: input.variantId,
          qty: input.qty,
        });
      }

      return cartWithItems(myCart.id);
    }),

  updateItemQty: authed
    .input(z.object({ itemId: z.number(), qty: z.number().int().min(1) }))
    .handler(async ({ context, input }) => {
      const myCart = await getOrCreateCart(context.user.id);
      await db
        .update(schema.cartItems)
        .set({ qty: input.qty })
        .where(and(eq(schema.cartItems.id, input.itemId), eq(schema.cartItems.cartId, myCart.id)));
      return cartWithItems(myCart.id);
    }),

  removeItem: authed.input(z.object({ itemId: z.number() })).handler(async ({ context, input }) => {
    const myCart = await getOrCreateCart(context.user.id);
    await db
      .delete(schema.cartItems)
      .where(and(eq(schema.cartItems.id, input.itemId), eq(schema.cartItems.cartId, myCart.id)));
    return cartWithItems(myCart.id);
  }),

  clear: authed.handler(async ({ context }) => {
    const myCart = await getOrCreateCart(context.user.id);
    await db.delete(schema.cartItems).where(eq(schema.cartItems.cartId, myCart.id));
    return cartWithItems(myCart.id);
  }),
};
