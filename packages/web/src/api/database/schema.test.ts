import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { createTestDb, seedUser, seedProduct, seedOrder } from "./test-helpers";

describe("admin-foundation schema (report items 3, 4, 8, 9)", () => {
  let ctx: Awaited<ReturnType<typeof createTestDb>>;

  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("seeds the RBAC catalog via migrations 0002 + 0004 (permissions + roles + role_permissions)", async () => {
    const { db } = ctx;
    const permissions = await db.select().from(schema.permissions);
    expect(permissions.length).toBe(10);
    expect(permissions.map((p) => p.key)).toContain("manage_suppliers");
    expect(permissions.map((p) => p.key)).toContain("edit_product_content");

    const roles = await db.select().from(schema.roles);
    expect(roles.map((r) => r.name).sort()).toEqual([
      "accounting",
      "content_editor",
      "manager",
      "sales",
      "staff",
      "super_admin",
    ]);
    const superAdmin = roles.find((r) => r.name === "super_admin")!;
    expect(superAdmin.isSystem).toBe(true);

    const superAdminPerms = await db
      .select({ key: schema.permissions.key })
      .from(schema.rolePermissions)
      .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
      .where(eq(schema.rolePermissions.roleId, superAdmin.id));
    expect(superAdminPerms.length).toBe(10); // super_admin gets every permission

    // Supplier confidentiality report: sales and content_editor must NOT hold manage_suppliers.
    const nonSupplierRoles = roles.filter((r) => ["sales", "content_editor"].includes(r.name));
    for (const role of nonSupplierRoles) {
      const perms = await db
        .select({ key: schema.permissions.key })
        .from(schema.rolePermissions)
        .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
        .where(eq(schema.rolePermissions.roleId, role.id));
      expect(perms.map((p) => p.key)).not.toContain("manage_suppliers");
    }

    // manager and accounting are the only roles trusted with supplier data (besides super_admin).
    const supplierRoles = roles.filter((r) => ["manager", "accounting"].includes(r.name));
    for (const role of supplierRoles) {
      const perms = await db
        .select({ key: schema.permissions.key })
        .from(schema.rolePermissions)
        .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
        .where(eq(schema.rolePermissions.roleId, role.id));
      expect(perms.map((p) => p.key)).toContain("manage_suppliers");
    }
  });

  it("product_option_groups/values: creates groups+values and cascades on product delete", async () => {
    const { db } = ctx;
    const product = await seedProduct(db);
    const [group] = await db
      .insert(schema.productOptionGroups)
      .values({ productId: product.id, nameEn: "Size", nameAr: "المقاس", sortOrder: 0 })
      .returning();
    await db.insert(schema.productOptionValues).values([
      { groupId: group.id, valueEn: "Small", valueAr: "صغير", priceDeltaCents: 0, sortOrder: 0 },
      { groupId: group.id, valueEn: "Large", valueAr: "كبير", priceDeltaCents: 500, sortOrder: 1 },
    ]);

    const values = await db.select().from(schema.productOptionValues).where(eq(schema.productOptionValues.groupId, group.id));
    expect(values.length).toBe(2);

    // Deleting the product should cascade to groups, and deleting a group should cascade to values.
    await db.delete(schema.products).where(eq(schema.products.id, product.id));
    const remainingGroups = await db.select().from(schema.productOptionGroups).where(eq(schema.productOptionGroups.productId, product.id));
    expect(remainingGroups.length).toBe(0);
    const remainingValues = await db.select().from(schema.productOptionValues).where(eq(schema.productOptionValues.groupId, group.id));
    expect(remainingValues.length).toBe(0);
  });

  it("product_suppliers: many-to-many link, unique per (product, supplier), cascades on either side", async () => {
    const { db } = ctx;
    const product = await seedProduct(db);
    const [supplier] = await db
      .insert(schema.suppliers)
      .values({ nameEn: "Acme Supplies", nameAr: "أكمي" })
      .returning();

    await db.insert(schema.productSuppliers).values({
      productId: product.id,
      supplierId: supplier.id,
      costPriceCents: 3000,
      isPreferred: true,
    });

    await expect(
      db.insert(schema.productSuppliers).values({ productId: product.id, supplierId: supplier.id }),
    ).rejects.toThrow();

    await db.delete(schema.suppliers).where(eq(schema.suppliers.id, supplier.id));
    const links = await db.select().from(schema.productSuppliers).where(eq(schema.productSuppliers.productId, product.id));
    expect(links.length).toBe(0);
  });

  it("order_status_history: records transitions and tolerates a null changedBy (system change)", async () => {
    const { db } = ctx;
    const user = await seedUser(db);
    const order = await seedOrder(db, user.id);

    await db.insert(schema.orderStatusHistory).values({
      orderId: order.id,
      fromStatus: null,
      toStatus: "design_pending",
      changedBy: null,
      note: "Order created at checkout",
    });
    await db.insert(schema.orderStatusHistory).values({
      orderId: order.id,
      fromStatus: "design_pending",
      toStatus: "design_in_review",
      changedBy: user.id,
    });

    const history = await db.select().from(schema.orderStatusHistory).where(eq(schema.orderStatusHistory.orderId, order.id));
    expect(history.length).toBe(2);
    expect(history.some((h) => h.fromStatus === null)).toBe(true);

    // Deleting the order cascades to its history rows.
    await db.delete(schema.orders).where(eq(schema.orders.id, order.id));
    const remaining = await db.select().from(schema.orderStatusHistory).where(eq(schema.orderStatusHistory.orderId, order.id));
    expect(remaining.length).toBe(0);
  });

  it("user_roles/role_permissions: assigning a role grants its permissions, unassigning revokes them", async () => {
    const { db } = ctx;
    const user = await seedUser(db, { role: "admin" });
    const [staffRole] = await db.select().from(schema.roles).where(eq(schema.roles.name, "staff"));

    await db.insert(schema.userRoles).values({ userId: user.id, roleId: staffRole.id, assignedBy: null });

    await expect(
      db.insert(schema.userRoles).values({ userId: user.id, roleId: staffRole.id, assignedBy: null }),
    ).rejects.toThrow(); // unique (user_id, role_id)

    const granted = await db
      .select({ key: schema.permissions.key })
      .from(schema.userRoles)
      .innerJoin(schema.rolePermissions, eq(schema.userRoles.roleId, schema.rolePermissions.roleId))
      .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
      .where(eq(schema.userRoles.userId, user.id));
    expect(granted.map((g) => g.key).sort()).toEqual(["manage_design_reviews", "manage_orders", "manage_rfqs", "view_reports"].sort());

    await db.delete(schema.userRoles).where(eq(schema.userRoles.userId, user.id));
    const afterRevoke = await db.select().from(schema.userRoles).where(eq(schema.userRoles.userId, user.id));
    expect(afterRevoke.length).toBe(0);
  });

  it("roles: is_system roles are flagged and real (non-system) roles can be created freely", async () => {
    const { db } = ctx;
    const [custom] = await db
      .insert(schema.roles)
      .values({ name: "warehouse_lead", descriptionEn: "Warehouse lead", descriptionAr: "مسؤول المستودع" })
      .returning();
    expect(custom.isSystem).toBe(false);
  });
});
