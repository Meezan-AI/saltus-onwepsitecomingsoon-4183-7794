import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { authed } from "../../middleware/auth";
import { db } from "../../database";
import * as schema from "../../database/schema";
import { recordOrderStatusChange } from "../../services/order-status-history";
import { sendEmail } from "../../services/email";
import { deskRouting } from "../../services/email-routing";
import { normalizePhone } from "../../services/phone";

function generateOrderNumber() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SO-${stamp}-${random}`;
}

/** Joins the product/variant onto a request row so the UI can show a name without a second round-trip. */
async function rfqWithProduct(requestId: number) {
  const [row] = await db
    .select({
      request: schema.rfqRequests,
      product: schema.products,
      variant: schema.productVariants,
    })
    .from(schema.rfqRequests)
    .innerJoin(schema.products, eq(schema.rfqRequests.productId, schema.products.id))
    .leftJoin(schema.productVariants, eq(schema.rfqRequests.variantId, schema.productVariants.id))
    .where(eq(schema.rfqRequests.id, requestId));
  if (!row) return null;
  return { ...row.request, product: row.product, variant: row.variant };
}

/**
 * Quote requests (RFQ) — report section 7. Admin responds from
 * routes/marketplace/admin/rfqs.ts; this file is the customer-facing half:
 * submit a request, track it, accept or decline the quoted price.
 */
export const rfq = {
  list: authed.handler(async ({ context }) => {
    const rows = await db
      .select({
        request: schema.rfqRequests,
        product: schema.products,
        variant: schema.productVariants,
      })
      .from(schema.rfqRequests)
      .innerJoin(schema.products, eq(schema.rfqRequests.productId, schema.products.id))
      .leftJoin(schema.productVariants, eq(schema.rfqRequests.variantId, schema.productVariants.id))
      .where(eq(schema.rfqRequests.userId, context.user.id))
      .orderBy(desc(schema.rfqRequests.id));
    return rows.map((row) => ({ ...row.request, product: row.product, variant: row.variant }));
  }),

  get: authed.input(z.object({ id: z.number() })).handler(async ({ context, input }) => {
    const request = await rfqWithProduct(input.id);
    if (!request || request.userId !== context.user.id) throw new ORPCError("NOT_FOUND");
    return request;
  }),

  create: authed
    .input(
      z.object({
        productId: z.number(),
        variantId: z.number().optional(),
        qty: z.number().int().min(1).default(1),
        notes: z.string().max(2000).optional(),
        contactEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
        contactWhatsapp: z.string().trim().max(40).optional().or(z.literal("")),
      }),
    )
    .handler(async ({ context, input }) => {
      const contactEmail = input.contactEmail ? input.contactEmail.toLowerCase() : null;
      let contactWhatsapp: string | null = null;
      if (input.contactWhatsapp) {
        contactWhatsapp = normalizePhone(input.contactWhatsapp);
        if (!contactWhatsapp) throw new ORPCError("BAD_REQUEST", { message: "Invalid WhatsApp number" });
      }
      if (!contactEmail && !contactWhatsapp) {
        throw new ORPCError("BAD_REQUEST", { message: "Provide an email or a WhatsApp number" });
      }

      const [product] = await db.select().from(schema.products).where(eq(schema.products.id, input.productId));
      if (!product || !product.isActive) throw new ORPCError("NOT_FOUND", { message: "Product not found" });
      if (!product.allowRfq) throw new ORPCError("BAD_REQUEST", { message: "This product is direct-purchase only" });

      const { productId, variantId, qty, notes } = input;
      const [request] = await db
        .insert(schema.rfqRequests)
        .values({ productId, variantId, qty, notes, contactEmail, contactWhatsapp, userId: context.user.id })
        .returning();

      // Best-effort heads-up to the Saltus inbox — the request is already saved
      // and visible in Admin → RFQs, so a failed email never fails the request.
      const variant = variantId
        ? (await db.select().from(schema.productVariants).where(eq(schema.productVariants.id, variantId)))[0]
        : undefined;
      const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;");
      const waLink = contactWhatsapp ? `https://wa.me/${contactWhatsapp.slice(1)}` : null;
      const routing = deskRouting("contact");
      void sendEmail({
        to: routing.to,
        from: routing.from,
        replyTo: contactEmail ?? undefined,
        subject: `New quote request RFQ-${request.id} — ${product.nameEn}`,
        text: [
          `New quote request RFQ-${request.id}`,
          `Product: ${product.nameEn}${variant ? ` (${variant.name})` : ""}`,
          `Quantity: ${qty}`,
          `Customer: ${context.user.name} <${context.user.email}>`,
          `Send quote to — email: ${contactEmail ?? "—"} | WhatsApp: ${contactWhatsapp ?? "—"}`,
          notes ? `Notes: ${notes}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        html: `<div style="font-family:Arial,sans-serif;color:#0b1f3a"><h2>New quote request RFQ-${request.id}</h2>
          <p><b>Product:</b> ${esc(product.nameEn)}${variant ? ` (${esc(variant.name)})` : ""}<br/>
          <b>Quantity:</b> ${qty}<br/>
          <b>Customer:</b> ${esc(context.user.name)} &lt;${esc(context.user.email)}&gt;<br/>
          <b>Quote to — email:</b> ${contactEmail ? esc(contactEmail) : "—"}<br/>
          <b>Quote to — WhatsApp:</b> ${waLink ? `<a href="${waLink}">${contactWhatsapp}</a>` : "—"}</p>
          ${notes ? `<p><b>Notes:</b> ${esc(notes)}</p>` : ""}</div>`,
      }).catch((err) => console.warn("[rfq] notification failed", err));

      return request;
    }),

  /** Customer accepts a quoted price — creates the order and moves the RFQ to "accepted". */
  accept: authed.input(z.object({ id: z.number() })).handler(async ({ context, input }) => {
    const [request] = await db.select().from(schema.rfqRequests).where(eq(schema.rfqRequests.id, input.id));
    if (!request || request.userId !== context.user.id) throw new ORPCError("NOT_FOUND");
    if (request.status !== "quoted" || !request.quotedPriceCents) {
      throw new ORPCError("BAD_REQUEST", { message: "This request has no active quote" });
    }
    if (request.validUntil && request.validUntil.getTime() < Date.now()) {
      await db.update(schema.rfqRequests).set({ status: "expired" }).where(eq(schema.rfqRequests.id, request.id));
      throw new ORPCError("BAD_REQUEST", { message: "This quote has expired" });
    }

    const [product] = await db.select().from(schema.products).where(eq(schema.products.id, request.productId));
    if (!product) throw new ORPCError("NOT_FOUND", { message: "Product not found" });

    const fulfillmentType = product.fulfillmentType === "pickup_rental" ? "pickup_rental" : "delivery";
    const unitPriceCents = Math.round(request.quotedPriceCents / request.qty);

    const [order] = await db
      .insert(schema.orders)
      .values({
        orderNumber: generateOrderNumber(),
        userId: context.user.id,
        fulfillmentType,
        subtotalCents: request.quotedPriceCents,
        totalCents: request.quotedPriceCents,
        notes: `RFQ #${request.id}`,
      })
      .returning();

    await db.insert(schema.orderItems).values({
      orderId: order.id,
      productId: request.productId,
      variantId: request.variantId,
      qty: request.qty,
      unitPriceCents,
      lineTotalCents: request.quotedPriceCents,
    });

    await db
      .update(schema.rfqRequests)
      .set({ status: "accepted", convertedOrderId: order.id })
      .where(eq(schema.rfqRequests.id, request.id));

    await recordOrderStatusChange({
      orderId: order.id,
      fromStatus: null,
      toStatus: order.status,
      changedBy: context.user.id,
      note: `Order created from accepted RFQ #${request.id}`,
    });

    return order;
  }),

  decline: authed.input(z.object({ id: z.number() })).handler(async ({ context, input }) => {
    const [request] = await db.select().from(schema.rfqRequests).where(eq(schema.rfqRequests.id, input.id));
    if (!request || request.userId !== context.user.id) throw new ORPCError("NOT_FOUND");
    const [updated] = await db
      .update(schema.rfqRequests)
      .set({ status: "declined" })
      .where(eq(schema.rfqRequests.id, request.id))
      .returning();
    return updated;
  }),
};
