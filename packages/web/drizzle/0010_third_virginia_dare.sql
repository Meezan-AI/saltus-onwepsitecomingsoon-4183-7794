ALTER TABLE `quotes` ADD `prepared_by_name` text;--> statement-breakpoint
ALTER TABLE `quotes` ADD `prepared_by_phone` text;--> statement-breakpoint
ALTER TABLE `quotes` ADD `share_token` text;--> statement-breakpoint
ALTER TABLE `quotes` ADD `last_sent_at` integer;--> statement-breakpoint
ALTER TABLE `quotes` ADD `last_sent_via` text;--> statement-breakpoint
ALTER TABLE `quotes` ADD `last_sent_to` text;--> statement-breakpoint
CREATE UNIQUE INDEX `quotes_share_token_unique` ON `quotes` (`share_token`);--> statement-breakpoint
UPDATE sqlite_sequence SET seq = 0 WHERE name = 'quotes' AND NOT EXISTS (SELECT 1 FROM quotes);
