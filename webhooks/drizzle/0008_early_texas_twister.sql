CREATE TABLE `proxy_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`environment_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`proxy_ids` text NOT NULL,
	`load_balancing_strategy` text DEFAULT 'random' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `proxy_servers` (
	`id` text PRIMARY KEY NOT NULL,
	`environment_id` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`description` text,
	`secret` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`region` text,
	`provider` text,
	`static_ip` text,
	`health_check_url` text,
	`timeout_ms` integer DEFAULT 30000 NOT NULL,
	`max_concurrent_requests` integer DEFAULT 100 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `endpoints` ADD `proxy_group_id` text;