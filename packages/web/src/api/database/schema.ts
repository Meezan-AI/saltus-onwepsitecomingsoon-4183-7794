import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

/**
 * Define your database schema here, then apply it with `bun run db:push`
 * (from packages/web). Re-export any generated schema from this file
 * (e.g. Better Auth's auth-schema.ts) so drizzle generates complete migrations.
 * Table patterns and conventions: skills/app/references/api.md
 */

// Better Auth tables (user, session, account, verification) — generated via
// `bun x auth generate`. `user.role` ("customer" | "admin") is defined in
// src/api/auth.ts as an additional field. Do not hand-edit auth-schema.ts —
// regenerate it with the CLI if the auth config changes.
export * from "./auth-schema";

/** Lead / proposal requests submitted from the website forms. */
export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email").notNull(),
  phone: text("phone"),
  interest: text("interest"),
  message: text("message"),
  lang: text("lang"),
  page: text("page"),
  emailed: integer("emailed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ---------------------------------------------------------------------------
// Marketplace
// ---------------------------------------------------------------------------

/** Product categories (with optional parent for sub-categories). */
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  slug: text("slug").notNull().unique(),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Marketplace products — equipment, printing, gifts, services, etc. */
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sku: text("sku").notNull().unique(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  categoryId: integer("category_id").references(() => categories.id),
  /** equipment | printing | gift | service | other */
  type: text("type").notNull().default("other"),
  /** pickup_rental | delivery | mixed_per_variant */
  fulfillmentType: text("fulfillment_type").notNull().default("delivery"),
  allowDirectPurchase: integer("allow_direct_purchase", { mode: "boolean" }).notNull().default(true),
  allowRfq: integer("allow_rfq", { mode: "boolean" }).notNull().default(true),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

/** Product photos, stored in S3/Tigris — only the object key lives here. */
export const productImages = sqliteTable("product_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  s3Key: text("s3_key").notNull(),
  altEn: text("alt_en"),
  altAr: text("alt_ar"),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Priceable variants of a product (size, rental duration, etc.). */
export const productVariants = sqliteTable("product_variants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sku: text("sku"),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("JOD"),
  /** null = unlimited / not stock-tracked */
  stockQty: integer("stock_qty"),
  /** day | week | event | null (not a rental) */
  rentalUnit: text("rental_unit"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

/** Customer delivery / billing addresses. */
export const addresses = sqliteTable("addresses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  label: text("label"),
  recipientName: text("recipient_name").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** One open cart per customer. */
export const carts = sqliteTable("carts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cartId: integer("cart_id")
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  variantId: integer("variant_id").references(() => productVariants.id),
  qty: integer("qty").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** A placed order — one fulfillment type per order (mixed carts are split at checkout). */
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  /** pickup_rental | delivery */
  fulfillmentType: text("fulfillment_type").notNull(),
  /**
   * design_pending | design_in_review | design_approved | payment_pending |
   * payment_confirmed | in_fulfillment | ready_for_pickup | out_for_delivery |
   * completed | cancelled | refunded
   */
  status: text("status").notNull().default("design_pending"),
  subtotalCents: integer("subtotal_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  currency: text("currency").notNull().default("JOD"),
  deliveryAddressId: integer("delivery_address_id").references(() => addresses.id),
  /** pending | awaiting_confirmation | paid | failed | refunded — mirrors latest payment_intents row */
  paymentStatus: text("payment_status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  variantId: integer("variant_id").references(() => productVariants.id),
  qty: integer("qty").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull(),
  lineTotalCents: integer("line_total_cents").notNull(),
  /**
   * pending_upload | submitted | in_review | approved | changes_requested |
   * not_required (admin override — see report section 8)
   */
  designStatus: text("design_status").notNull().default("pending_upload"),
});

/** Versioned design uploads per order item — files live in S3/Tigris, only metadata here. */
export const designFiles = sqliteTable("design_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderItemId: integer("order_item_id")
    .notNull()
    .references(() => orderItems.id, { onDelete: "cascade" }),
  s3Key: text("s3_key").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  version: integer("version").notNull().default(1),
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => user.id),
  /** submitted | in_review | approved | changes_requested */
  status: text("status").notNull().default("submitted"),
  reviewerNote: text("reviewer_note"),
  reviewedBy: text("reviewed_by").references(() => user.id),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Quote requests (RFQ) — can be converted into an order once accepted. */
export const rfqRequests = sqliteTable("rfq_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  variantId: integer("variant_id").references(() => productVariants.id),
  qty: integer("qty").notNull().default(1),
  notes: text("notes"),
  /** new | quoted | accepted | declined | expired */
  status: text("status").notNull().default("new"),
  quotedPriceCents: integer("quoted_price_cents"),
  quotedBy: text("quoted_by").references(() => user.id),
  quotedAt: integer("quoted_at", { mode: "timestamp" }),
  validUntil: integer("valid_until", { mode: "timestamp" }),
  convertedOrderId: integer("converted_order_id").references(() => orders.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

/**
 * Provider-agnostic payment tracking. `provider` is "manual" for the whole
 * v1 (admin confirms bank transfer / cash / pay-on-pickup by hand) — a
 * "madfoatcom" provider plugs in later behind the same table, once Saltus
 * provides the official MadfoatCom API docs. No gateway keys/URLs are
 * assumed anywhere in this schema or its consumers.
 */
export const paymentIntents = sqliteTable("payment_intents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  /** manual | madfoatcom */
  provider: text("provider").notNull().default("manual"),
  /** pending | awaiting_confirmation | paid | failed | refunded */
  status: text("status").notNull().default("pending"),
  amountCents: integer("amount_cents").notNull(),
  providerReference: text("provider_reference"),
  rawPayload: text("raw_payload"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});
