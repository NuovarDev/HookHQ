PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_webhook_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`event_type` text,
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
INSERT INTO `__new_webhook_messages`("id", "event_id", "event_type", "environment_id", "endpoint_ids", "endpoint_group_ids", "payload", "payload_size", "status", "attempts", "max_attempts", "created_at", "queued_at", "processing_started_at", "delivered_at", "failed_at", "last_error", "last_error_at", "response_status", "response_time_ms", "response_body", "idempotency_key", "metadata") SELECT "id", "event_id", "event_type", "environment_id", "endpoint_ids", "endpoint_group_ids", "payload", "payload_size", "status", "attempts", "max_attempts", "created_at", "queued_at", "processing_started_at", "delivered_at", "failed_at", "last_error", "last_error_at", "response_status", "response_time_ms", "response_body", "idempotency_key", "metadata" FROM `webhook_messages`;--> statement-breakpoint
DROP TABLE `webhook_messages`;--> statement-breakpoint
ALTER TABLE `__new_webhook_messages` RENAME TO `webhook_messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;