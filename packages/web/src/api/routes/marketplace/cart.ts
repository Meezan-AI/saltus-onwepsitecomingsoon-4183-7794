import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { authed } from "../../middleware/auth";
import { db } from "../../database";
import * as schema from "../../database/schema";
import { activeDiscountPercent, applyDiscount } from "../../lib/pricing";

export const designFileInput = z.object({
  s3Key: z.string().max(500),
  fileName: z.string().max(255),
  mimeType: z.string().optional(),
  sizeBytes: z.number().optional(),
});
export type CartDesignFile = z.infer<typeof designFileInput>;

export function parseDesignFiles(json: string | null): CartDesignFile[] {
  if (!json) return [];
  try {
    return z.array(designFileInput).parse(JSON.parse(json));
  } catch {
    return [];
  }
}

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
      designMode: schema.cartItems.designMode,
      designBrief: schema.cartItems.designBrief,
      designFilesJson: schema.cartItems.designFilesJson,
      product: schema.products,
      variant: schema.productVariants,
    })
    .from(schema.cartItems)
    .innerJoin(schema.products, eq(schema.cartItems.productId, schema.products.id))
    .leftJoin(schema.productVariants, eq(schema.cartItems.variantId, schema.productVariants.id))
    .where(eq(schema.cartItems.cartId, cartId));

  return {
    id: cartId,
    items: items.map(({ designFilesJson, ...item }) => {
      const discountPercent = activeDiscountPercent(item.product);
      return {
        ...item,
        // `variant.priceCents` stays the list price; the customer pays `unitPriceCents`.
        product: { ...item.product, discountPercent },
        unitPriceCents: item.variant ? applyDiscount(item.variant.priceCents, discountPercent) : 0,
        designFiles: parseDesignFiles(designFilesJson),
      };
    }),
  };
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

  /**
   * How the customer wants to handle artwork for one cart line (own files /
   * ask Saltus to design / no design / decide later). Files were already
   * uploaded privately via uploads.presignCartDesignFile — only keys under
   * this exact cart item's prefix are accepted, so a customer can never
   * attach someone else's uploaded file.
   */
  setItemDesign: authed
    .input(
      z.object({
        itemId: z.number(),
        mode: z.enum(["own", "request", "none", "later"]),
        brief: z.string().max(3000).optional(),
        files: z.array(designFileInput).max(10).default([]),
      }),
    )
    .handler(async ({ context, input }) => {
      const myCart = await getOrCreateCart(context.user.id);
      const [item] = await db
        .select()
        .from(schema.cartItems)
        .where(and(eq(schema.cartItems.id, input.itemId), eq(schema.cartItems.cartId, myCart.id)));
      if (!item) throw new ORPCError("NOT_FOUND");

      const prefix = `design-files/cart-${item.id}/`;
      if (input.files.some((f) => !f.s3Key.startsWith(prefix))) {
        throw new ORPCError("BAD_REQUEST", { message: "Invalid design file" });
      }
      const keepsFiles = input.mode === "own" || input.mode === "request";
      const brief = input.brief?.trim() || null;
      if (input.mode === "request" && !brief) {
        throw new ORPCError("BAD_REQUEST", { message: "Please describe the design you need" });
      }

      await db
        .update(schema.cartItems)
        .set({
          designMode: input.mode,
          designBrief: input.mode === "none" || input.mode === "later" ? null : brief,
          designFilesJson: keepsFiles && input.files.length ? JSON.stringify(input.files) : null,
        })
        .where(eq(schema.cartItems.id, item.id));
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
