CREATE TABLE `quotes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_name` text NOT NULL,
	`company` text,
	`phone` text,
	`email` text,
	`subject` text,
	`issue_date` text NOT NULL,
	`lines_json` text NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`vat_percent` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
