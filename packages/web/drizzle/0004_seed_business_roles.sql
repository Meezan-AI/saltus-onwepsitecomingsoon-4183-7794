-- Business-role RBAC seed (supplier confidentiality report). Idempotent, same
-- pattern as 0002_seed_rbac.sql. Adds one new permission for content-only
-- product edits, and four day-to-day business roles with deliberately
-- different access — in particular, only `manager` and `accounting` are
-- granted `manage_suppliers`; `sales` and `content_editor` are not, so they
-- can never see supplier identity, cost, contact or internal notes.

INSERT INTO `permissions` (`key`, `description_en`, `description_ar`, `created_at`)
SELECT 'edit_product_content', 'Edit a product''s public name, description and photos only — no price or supplier access', 'تعديل اسم المنتج ووصفه وصوره العامة فقط — بدون الوصول للسعر أو بيانات المورد', unixepoch()
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `key` = 'edit_product_content');
--> statement-breakpoint

INSERT INTO `roles` (`name`, `description_en`, `description_ar`, `is_system`, `created_at`, `updated_at`)
SELECT 'manager', 'Runs day-to-day marketplace operations: catalog, suppliers, orders, RFQs and reports', 'يدير العمليات اليومية للمتجر: الكتالوج والموردين والطلبات وعروض الأسعار والتقارير', 0, unixepoch(), unixepoch()
WHERE NOT EXISTS (SELECT 1 FROM `roles` WHERE `name` = 'manager');
--> statement-breakpoint

INSERT INTO `roles` (`name`, `description_en`, `description_ar`, `is_system`, `created_at`, `updated_at`)
SELECT 'sales', 'Handles customer orders, RFQs and accounts — no supplier or cost visibility', 'يتعامل مع طلبات العملاء وعروض الأسعار والحسابات — بدون رؤية بيانات الموردين أو التكلفة', 0, unixepoch(), unixepoch()
WHERE NOT EXISTS (SELECT 1 FROM `roles` WHERE `name` = 'sales');
--> statement-breakpoint

INSERT INTO `roles` (`name`, `description_en`, `description_ar`, `is_system`, `created_at`, `updated_at`)
SELECT 'accounting', 'Reconciles orders and supplier costs for invoicing and margins', 'يراجع الطلبات وتكاليف الموردين لأغراض الفوترة وحساب الأرباح', 0, unixepoch(), unixepoch()
WHERE NOT EXISTS (SELECT 1 FROM `roles` WHERE `name` = 'accounting');
--> statement-breakpoint

INSERT INTO `roles` (`name`, `description_en`, `description_ar`, `is_system`, `created_at`, `updated_at`)
SELECT 'content_editor', 'Edits public product name, description and photos only', 'يحرر اسم المنتج ووصفه وصوره العامة فقط', 0, unixepoch(), unixepoch()
WHERE NOT EXISTS (SELECT 1 FROM `roles` WHERE `name` = 'content_editor');
--> statement-breakpoint

-- manager: everything but manage_admins (full operational access, including supplier data).
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p
WHERE r.name = 'manager'
  AND p.key IN (
    'manage_products', 'manage_categories', 'manage_suppliers', 'manage_orders',
    'manage_rfqs', 'manage_design_reviews', 'manage_customers', 'view_reports',
    'edit_product_content'
  )
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
--> statement-breakpoint

-- sales: customer-facing order/RFQ work only. No manage_products, no manage_suppliers.
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p
WHERE r.name = 'sales'
  AND p.key IN ('manage_orders', 'manage_rfqs', 'manage_customers', 'view_reports')
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
--> statement-breakpoint

-- accounting: needs supplier cost data for margins/invoicing, plus order visibility.
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p
WHERE r.name = 'accounting'
  AND p.key IN ('manage_orders', 'manage_suppliers', 'view_reports')
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
--> statement-breakpoint

-- content_editor: public product content only — never price, never supplier data.
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p
WHERE r.name = 'content_editor'
  AND p.key IN ('edit_product_content')
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
--> statement-breakpoint

-- super_admin keeps "every permission" as new ones are introduced (same
-- unfiltered grant shape as 0002_seed_rbac.sql) — backfills edit_product_content.
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p
WHERE r.name = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
