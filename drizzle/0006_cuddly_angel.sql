CREATE TABLE `endpoint_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`environment_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`endpoint_ids` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `endpoints` (
	`id` text PRIMARY KEY NOT NULL,
	`environment_id` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`retry_policy` text DEFAULT 'exponential',
	`max_retries` integer DEFAULT 3 NOT NULL,
	`timeout_ms` integer DEFAULT 30000 NOT NULL,
	`headers` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `webhook_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`endpoint_id` text NOT NULL,
	`attempt_number` integer NOT NULL,
	`request_url` text NOT NULL,
	`request_method` text DEFAULT 'POST' NOT NULL,
	`request_headers` text,
	`request_body` text,
	`response_status` integer,
	`response_headers` text,
	`response_body` text,
	`response_time_ms` integer,
	`status` text NOT NULL,
	`error_message` text,
	`attempted_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE `webhook_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`event_type` text NOT NULL,
	`environment_id` text NOT NULL,
	`endpoint_ids` text NOT NULL,
	`endpoint_group_ids` text NOT NULL,
	`payload` text,
	`payload_size` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`queued_at` integer,
	`processing_started_at` integer,
	`delivered_at` integer,
	`failed_at` integer,
	`last_error` text,
	`last_error_at` integer,
	`response_status` integer,
	`response_time_ms` integer,
	`response_body` text,
	`idempotency_key` text,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `webhook_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`environment_id` text NOT NULL,
	`endpoint_id` text,
	`date` text NOT NULL,
	`total_messages` integer DEFAULT 0 NOT NULL,
	`delivered_messages` integer DEFAULT 0 NOT NULL,
	`failed_messages` integer DEFAULT 0 NOT NULL,
	`retry_messages` integer DEFAULT 0 NOT NULL,
	`avg_response_time` real,
	`min_response_time` integer,
	`max_response_time` integer,
	`error_4xx` integer DEFAULT 0 NOT NULL,
	`error_5xx` integer DEFAULT 0 NOT NULL,
	`timeout_errors` integer DEFAULT 0 NOT NULL,
	`network_errors` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
