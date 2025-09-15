CREATE TABLE `event_types` (
	`id` text PRIMARY KEY NOT NULL,
	`environment_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`schema` text,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
