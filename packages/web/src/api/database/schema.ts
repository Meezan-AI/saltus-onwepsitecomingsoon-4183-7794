import { integer, sqliteTable, text, index, unique } from "drizzle-orm/sqlite-core";
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
  /** Storefront discount, 0-100. Applied to every variant price while active (see lib/pricing.ts). */
  discountPercent: integer("discount_percent").notNull().default(0),
  /** Optional end of the discount; null = no expiry. */
  discountEndsAt: integer("discount_ends_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

/**
 * Marketplace hero slides (product spotlights and offers). Admin-managed.
 * Click-through goes to the linked product, else the linked category, else linkUrl.
 * Without a title the image is shown full-bleed (for uploaded ready-made banners).
 */
export const marketplaceBanners = sqliteTable("marketplace_banners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  titleEn: text("title_en"),
  titleAr: text("title_ar"),
  subtitleEn: text("subtitle_en"),
  subtitleAr: text("subtitle_ar"),
  /** Small highlight chip, e.g. "Limited offer". Falls back to "-20%" when the linked product is discounted. */
  badgeEn: text("badge_en"),
  badgeAr: text("badge_ar"),
  /** Call-to-action button label; falls back to the generic "View details". */
  ctaEn: text("cta_en"),
  ctaAr: text("cta_ar"),
  imageKey: text("image_key").notNull(),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  linkUrl: text("link_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
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
  /** All `*Cents` money columns in this schema store the smallest currency subunit —
   *  for JOD (the only currency in v1) that's fils, 1000 per dinar, e.g. 45000 = 45.000 JOD. */
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
  /**
   * How the customer wants to handle artwork for this line, chosen at checkout:
   * own (I upload my files) | request (Saltus designs it) | none (no design needed)
   * | later (decide after ordering). Null = not chosen yet.
   */
  designMode: text("design_mode"),
  /** Free-text brief for a design request (or notes that go with uploaded files). */
  designBrief: text("design_brief"),
  /** JSON array of {s3Key,fileName,mimeType,sizeBytes} uploaded before the order exists. */
  designFilesJson: text("design_files_json"),
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
   * not_required (admin override — see report section 8) |
   * design_requested (customer asked Saltus to create the design)
   */
  designStatus: text("design_status").notNull().default("pending_upload"),
  /** own | request | none | later — what the customer picked at checkout. */
  designMode: text("design_mode"),
  /** The customer's design brief (what to design, text, colours, size, deadline). */
  designBrief: text("design_brief"),
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
  /** Where the customer wants the quote sent. At least one of the two is set. */
  contactEmail: text("contact_email"),
  /** E.164, e.g. +962795881811. */
  contactWhatsapp: text("contact_whatsapp"),
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
 * Conference & event planner — the editable list of things a customer can tick
 * in the planner. Items live in one of four fixed groups (printed | gifts |
 * venue | services). An item may point at a real catalog product: its active
 * variants then supply the (only) prices shown. No product = "requires a quote".
 */
export const eventPlanItems = sqliteTable("event_plan_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** printed | gifts | venue | services */
  groupKey: text("group_key").notNull(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descEn: text("desc_en"),
  descAr: text("desc_ar"),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  /** How the quantity starts: attendees (= expected attendees) | one | none (a service with no quantity). */
  qtyMode: text("qty_mode").notNull().default("one"),
  unitEn: text("unit_en"),
  unitAr: text("unit_ar"),
  /** JSON: [{ nameEn, nameAr, values: [{ en, ar }] }] — spec choices (size, colour, paper...). Never priced. */
  specsJson: text("specs_json").notNull().default("[]"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** A submitted conference / event planner request. `itemsJson` is a snapshot of what the customer chose, with prices at that time. */
export const eventPlanRequests = sqliteTable("event_plan_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => user.id),
  /** conference | exhibition | launch | meeting | other */
  eventType: text("event_type").notNull(),
  eventName: text("event_name"),
  /** YYYY-MM-DD */
  eventDate: text("event_date").notNull(),
  eventDays: integer("event_days").notNull().default(1),
  setupDays: integer("setup_days").notNull().default(0),
  city: text("city").notNull(),
  venue: text("venue"),
  attendees: integer("attendees").notNull(),
  contactName: text("contact_name").notNull(),
  company: text("company"),
  /** E.164 */
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  notes: text("notes"),
  lang: text("lang").notNull().default("en"),
  itemsJson: text("items_json").notNull(),
  /** Sum of the lines that had a catalog price; null when none did. */
  estimatedTotalCents: integer("estimated_total_cents"),
  /** Lines with no catalog price — they still need a quote. */
  unpricedCount: integer("unpriced_count").notNull().default(0),
  /** new | in_progress | quoted | closed */
  status: text("status").notNull().default("new"),
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

// ---------------------------------------------------------------------------
// Admin foundation (bulk 1): product options, suppliers, order status
// history, and the admin RBAC system. Existing marketplace tables above are
// untouched — these are additive only. New in this bulk: product option
// groups/values, suppliers + their product links, order status history, and
// the roles/permissions/user-role tables. Products, categories, orders,
// design files and RFQs already existed from Phase 0 and are reused as-is.
// ---------------------------------------------------------------------------

/** A named option group on a product, e.g. "Color" or "Size". */
export const productOptionGroups = sqliteTable(
  "product_option_groups",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    nameEn: text("name_en").notNull(),
    nameAr: text("name_ar").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("product_option_groups_product_id_idx").on(table.productId)],
);

/** One selectable value within an option group, e.g. "Red" under "Color". */
export const productOptionValues = sqliteTable(
  "product_option_values",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    groupId: integer("group_id")
      .notNull()
      .references(() => productOptionGroups.id, { onDelete: "cascade" }),
    valueEn: text("value_en").notNull(),
    valueAr: text("value_ar").notNull(),
    /** Added to the variant's priceCents when this value is picked — 0 for no surcharge. */
    priceDeltaCents: integer("price_delta_cents").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("product_option_values_group_id_idx").on(table.groupId)],
);

/** A vendor Saltus sources products from — contact details only, no auth of their own. */
export const suppliers = sqliteTable("suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  /** Geographic area/cities this supplier can deliver or service — internal only. */
  coverageArea: text("coverage_area"),
  /** Reference to the signed agreement/contract terms with this supplier — internal only. */
  agreementRef: text("agreement_ref"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

/** Many-to-many: a product can be sourced from several suppliers (for price comparison). */
export const productSuppliers = sqliteTable(
  "product_suppliers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    supplierId: integer("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    costPriceCents: integer("cost_price_cents"),
    leadTimeDays: integer("lead_time_days"),
    isPreferred: integer("is_preferred", { mode: "boolean" }).notNull().default(false),
    notes: text("notes"),
    /** The supplier's own part/SKU number for this product — internal only, never the storefront `products.sku`. */
    supplierSku: text("supplier_sku"),
    /** Backup supplier to switch to if this one can't fulfil — internal only. */
    alternativeSupplierId: integer("alternative_supplier_id").references(() => suppliers.id),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("product_suppliers_product_id_idx").on(table.productId),
    index("product_suppliers_supplier_id_idx").on(table.supplierId),
    unique("product_suppliers_product_supplier_unique").on(table.productId, table.supplierId),
  ],
);

/**
 * Full audit trail of every `orders.status` transition — written by
 * services/order-status-history.ts#recordOrderStatusChange, called from every
 * place that changes an order's status (checkout, RFQ acceptance, design
 * review, admin status updates/payment confirmation, customer cancellation).
 * `fromStatus` is null for the entry logged at order creation.
 */
export const orderStatusHistory = sqliteTable(
  "order_status_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    /** Null when the system changes the status itself (e.g. auto-advance on design approval). */
    changedBy: text("changed_by").references(() => user.id),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("order_status_history_order_id_idx").on(table.orderId)],
);

// ---------------------------------------------------------------------------
// Admin RBAC — roles and permissions for the admin dashboard (report item 9).
// `user.role` ("customer" | "admin") from Better Auth stays as the coarse
// gate used by the existing `adminOnly` middleware; these tables add a finer
// layer on top (see middleware/auth.ts#requirePermission) that Phase 4's
// admin routes can adopt feature-by-feature without breaking today's gate.
// ---------------------------------------------------------------------------

/** A single grantable capability, e.g. "manage_products". Seeded by migration, not user-created. */
export const permissions = sqliteTable("permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  descriptionEn: text("description_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** A named bundle of permissions assignable to admin users, e.g. "super_admin" or "staff". */
export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  /** Seeded roles (super_admin, staff) can't be deleted — only their permission set can change. */
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

/** Many-to-many: which permissions a role grants. */
export const rolePermissions = sqliteTable(
  "role_permissions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: integer("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("role_permissions_role_id_idx").on(table.roleId),
    index("role_permissions_permission_id_idx").on(table.permissionId),
    unique("role_permissions_role_permission_unique").on(table.roleId, table.permissionId),
  ],
);

/** Many-to-many: which roles an admin user holds — a user can hold more than one. */
export const userRoles = sqliteTable(
  "user_roles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assignedBy: text("assigned_by").references(() => user.id),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("user_roles_user_id_idx").on(table.userId),
    index("user_roles_role_id_idx").on(table.roleId),
    unique("user_roles_user_role_unique").on(table.userId, table.roleId),
  ],
);

// ---------------------------------------------------------------------------
// Audit log — every view or edit of a sensitive internal record (supplier
// identity, cost, contact, internal notes) is written here by
// services/audit-log.ts#recordAuditLog, called from admin/suppliers.ts.
// Append-only: nothing in the app ever updates or deletes a row here.
// ---------------------------------------------------------------------------

/** One view or mutation of a sensitive admin record — who, what, when. */
export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => user.id),
    /** "view" | "create" | "update" | "delete" */
    action: text("action").notNull(),
    /** What kind of record was touched, e.g. "supplier", "product_supplier_link". */
    entityType: text("entity_type").notNull(),
    /** Null for a list/collection view that isn't about one specific row. */
    entityId: integer("entity_id"),
    /** Free-form JSON string with extra context (e.g. which fields changed). */
    metadata: text("metadata"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("audit_logs_actor_user_id_idx").on(table.actorUserId),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  ],
);
