ALTER TABLE `event_plan_requests` ADD `share_token` text;--> statement-breakpoint
ALTER TABLE `event_plan_requests` ADD `last_sent_at` integer;--> statement-breakpoint
ALTER TABLE `event_plan_requests` ADD `last_sent_via` text;--> statement-breakpoint
ALTER TABLE `event_plan_requests` ADD `last_sent_to` text;--> statement-breakpoint
CREATE UNIQUE INDEX `event_plan_requests_share_token_unique` ON `event_plan_requests` (`share_token`);