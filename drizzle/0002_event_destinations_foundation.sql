ALTER TABLE `endpoints` ADD `retry_strategy` text DEFAULT 'exponential';
--> statement-breakpoint
ALTER TABLE `endpoints` ADD `max_retry_delay_seconds` integer DEFAULT 300 NOT NULL;
--> statement-breakpoint
ALTER TABLE `endpoints` ADD `retry_jitter_factor` real DEFAULT 0.2 NOT NULL;
--> statement-breakpoint
ALTER TABLE `endpoints` ADD `destination_type` text DEFAULT 'webhook';
--> statement-breakpoint
ALTER TABLE `endpoints` ADD `destination_config` text DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `endpoint_groups` ADD `failure_alert_config` text DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `endpoint_groups` ADD `event_types` text DEFAULT '["*"]' NOT NULL;
--> statement-breakpoint
UPDATE `endpoints` SET `topics` = '["*"]' WHERE `topics` IS NULL OR `topics` = '[]' OR `topics` = '';
--> statement-breakpoint
ALTER TABLE `server_config` ADD `default_retry_strategy` text DEFAULT 'exponential' NOT NULL;
--> statement-breakpoint
ALTER TABLE `server_config` ADD `default_base_delay_seconds` integer DEFAULT 5 NOT NULL;
--> statement-breakpoint
ALTER TABLE `server_config` ADD `default_max_retry_delay_seconds` integer DEFAULT 300 NOT NULL;
--> statement-breakpoint
ALTER TABLE `server_config` ADD `default_retry_jitter_factor` integer DEFAULT 20 NOT NULL;
--> statement-breakpoint
ALTER TABLE `server_config` ADD `default_failure_alert_config` text DEFAULT '{}' NOT NULL;
