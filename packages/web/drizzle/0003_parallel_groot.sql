CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_user_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_logs_actor_user_id_idx` ON `audit_logs` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
ALTER TABLE `product_suppliers` ADD `supplier_sku` text;--> statement-breakpoint
ALTER TABLE `product_suppliers` ADD `alternative_supplier_id` integer REFERENCES suppliers(id);--> statement-breakpoint
ALTER TABLE `suppliers` ADD `coverage_area` text;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `agreement_ref` text;