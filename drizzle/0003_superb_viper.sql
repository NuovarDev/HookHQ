ALTER TABLE `endpoint_groups` ADD `metadata` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `endpoints` ADD `metadata` text DEFAULT '{}' NOT NULL;