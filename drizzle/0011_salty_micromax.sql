CREATE TABLE `server_config` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`cloudflare_api_key` text,
	`cloudflare_account_id` text,
	`cloudflare_queue_id` text,
	`log_retention_days` integer DEFAULT 30 NOT NULL,
	`payload_retention_days` integer DEFAULT 7 NOT NULL,
	`default_max_retries` integer DEFAULT 3 NOT NULL,
	`default_timeout_ms` integer DEFAULT 30000 NOT NULL,
	`default_retry_policy` text DEFAULT 'retry' NOT NULL,
	`default_backoff_strategy` text DEFAULT 'exponential' NOT NULL,
	`queue_management_enabled` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_endpoints` (
	`id` text PRIMARY KEY NOT NULL,
	`environment_id` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`retry_policy` text DEFAULT 'retry',
	`backoff_strategy` text DEFAULT 'exponential',
	`base_delay_seconds` integer DEFAULT 5,
	`max_retries` integer DEFAULT 3 NOT NULL,
	`timeout_ms` integer DEFAULT 30000 NOT NULL,
	`headers` text,
	`proxy_group_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`topics` text DEFAULT '[]'
);
--> statement-breakpoint
INSERT INTO `__new_endpoints`("id", "environment_id", "name", "url", "description", "is_active", "retry_policy", "backoff_strategy", "base_delay_seconds", "max_retries", "timeout_ms", "headers", "proxy_group_id", "created_at", "updated_at", "topics") SELECT "id", "environment_id", "name", "url", "description", "is_active", "retry_policy", "backoff_strategy", "base_delay_seconds", "max_retries", "timeout_ms", "headers", "proxy_group_id", "created_at", "updated_at", "topics" FROM `endpoints`;--> statement-breakpoint
DROP TABLE `endpoints`;--> statement-breakpoint
ALTER TABLE `__new_endpoints` RENAME TO `endpoints`;--> statement-breakpoint
PRAGMA foreign_keys=ON;