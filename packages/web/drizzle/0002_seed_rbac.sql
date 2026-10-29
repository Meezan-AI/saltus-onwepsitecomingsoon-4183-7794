-- Admin RBAC seed data (report item 9). Idempotent: every INSERT is guarded
-- so re-running this file (e.g. a retried migration) is a no-op the second
-- time. All timestamps are unix seconds, these tables use timestamp mode.
-- Each statement below needs its own breakpoint marker comment: the libsql
-- batch protocol rejects a string holding more than one SQL statement.

INSERT INTO `permissions` (`key`, `description_en`, `description_ar`, `created_at`)
SELECT 'manage_products', 'Create and edit the product catalog', 'إنشاء وتعديل كتالوج المنتجات', unixepoch()
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `key` = 'manage_products');
--> statement-breakpoint

INSERT INTO `permissions` (`key`, `description_en`, `description_ar`, `created_at`)
SELECT 'manage_categories', 'Create and edit product categories', 'إنشاء وتعديل تصنيفات المنتجات', unixepoch()
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `key` = 'manage_categories');
--> statement-breakpoint

INSERT INTO `permissions` (`key`, `description_en`, `description_ar`, `created_at`)
SELECT 'manage_suppliers', 'Create and edit suppliers and their product links', 'إنشاء وتعديل الموردين وربطهم بالمنتجات', unixepoch()
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `key` = 'manage_suppliers');
--> statement-breakpoint

INSERT INTO `permissions` (`key`, `description_en`, `description_ar`, `created_at`)
SELECT 'manage_orders', 'View and update order status and payments', 'عرض وتحديث حالة الطلبات والدفعات', unixepoch()
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `key` = 'manage_orders');
--> statement-breakpoint

INSERT INTO `permissions` (`key`, `description_en`, `description_ar`, `created_at`)
SELECT 'manage_rfqs', 'Respond to and manage quote requests', 'الرد على طلبات عروض الأسعار وإدارتها', unixepoch()
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `key` = 'manage_rfqs');
--> statement-breakpoint

INSERT INTO `permissions` (`key`, `description_en`, `description_ar`, `created_at`)
SELECT 'manage_design_reviews', 'Approve or reject customer design uploads', 'الموافقة على ملفات التصميم المرفوعة أو رفضها', unixepoch()
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `key` = 'manage_design_reviews');
--> statement-breakpoint

INSERT INTO `permissions` (`key`, `description_en`, `description_ar`, `created_at`)
SELECT 'manage_customers', 'View customer accounts and their order history', 'عرض حسابات العملاء وسجل طلباتهم', unixepoch()
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `key` = 'manage_customers');
--> statement-breakpoint

INSERT INTO `permissions` (`key`, `description_en`, `description_ar`, `created_at`)
SELECT 'manage_admins', 'Create roles, edit permissions, and assign roles to admin users', 'إنشاء الأدوار وتعديل الصلاحيات وتعيينها للمستخدمين الإداريين', unixepoch()
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `key` = 'manage_admins');
--> statement-breakpoint

INSERT INTO `permissions` (`key`, `description_en`, `description_ar`, `created_at`)
SELECT 'view_reports', 'View dashboards and reports', 'عرض لوحات المعلومات والتقارير', unixepoch()
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `key` = 'view_reports');
--> statement-breakpoint

INSERT INTO `roles` (`name`, `description_en`, `description_ar`, `is_system`, `created_at`, `updated_at`)
SELECT 'super_admin', 'Full access to every admin capability', 'وصول كامل لجميع صلاحيات لوحة الإدارة', 1, unixepoch(), unixepoch()
WHERE NOT EXISTS (SELECT 1 FROM `roles` WHERE `name` = 'super_admin');
--> statement-breakpoint

INSERT INTO `roles` (`name`, `description_en`, `description_ar`, `is_system`, `created_at`, `updated_at`)
SELECT 'staff', 'Day-to-day order, RFQ and design review handling', 'إدارة الطلبات وعروض الأسعار ومراجعة التصاميم بشكل يومي', 1, unixepoch(), unixepoch()
WHERE NOT EXISTS (SELECT 1 FROM `roles` WHERE `name` = 'staff');
--> statement-breakpoint

INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p
WHERE r.name = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
--> statement-breakpoint

INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p
WHERE r.name = 'staff'
  AND p.key IN ('manage_orders', 'manage_rfqs', 'manage_design_reviews', 'view_reports')
  AND NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
--> statement-breakpoint

INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_by`, `created_at`)
SELECT u.id, r.id, NULL, unixepoch()
FROM `user` u
JOIN `roles` r ON r.name = 'super_admin'
WHERE u.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM `user_roles` ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );
