CREATE TABLE `marketplace_banners` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title_en` text,
	`title_ar` text,
	`subtitle_en` text,
	`subtitle_ar` text,
	`badge_en` text,
	`badge_ar` text,
	`cta_en` text,
	`cta_ar` text,
	`image_key` text NOT NULL,
	`product_id` integer,
	`category_id` integer,
	`link_url` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `products` ADD `discount_percent` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `discount_ends_at` integer;