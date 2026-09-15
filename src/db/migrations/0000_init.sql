CREATE TYPE "public"."cancellation_reason" AS ENUM('customer', 'deposit_rejected');--> statement-breakpoint
CREATE TYPE "public"."reservation_lang" AS ENUM('es', 'en');--> statement-breakpoint
CREATE TYPE "public"."reservation_source" AS ENUM('web', 'email');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('confirmed', 'pending_deposit', 'cancelled');--> statement-breakpoint
CREATE TABLE "deposit_receipts" (
	"deposit_reference" text PRIMARY KEY NOT NULL,
	"mime_type" text NOT NULL,
	"base64_data" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_webhook_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"confirmation_code" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"party_size" integer NOT NULL,
	"reservation_date" date NOT NULL,
	"reservation_time" time NOT NULL,
	"occasion" text,
	"notes" text,
	"status" "reservation_status" DEFAULT 'confirmed' NOT NULL,
	"source" "reservation_source" DEFAULT 'web' NOT NULL,
	"lang" "reservation_lang" DEFAULT 'es' NOT NULL,
	"deposit_required" integer DEFAULT 0 NOT NULL,
	"deposit_amount" integer DEFAULT 0 NOT NULL,
	"deposit_reference" text,
	"deposit_verified" boolean DEFAULT false NOT NULL,
	"cancellation_reason" "cancellation_reason",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	CONSTRAINT "reservations_confirmation_code_unique" UNIQUE("confirmation_code"),
	CONSTRAINT "reservations_party_size_positive" CHECK ("reservations"."party_size" >= 1),
	CONSTRAINT "reservations_deposit_non_negative" CHECK ("reservations"."deposit_required" >= 0 and "reservations"."deposit_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "slot_capacity" (
	"slot_time" time PRIMARY KEY NOT NULL,
	"capacity" integer NOT NULL,
	CONSTRAINT "slot_capacity_non_negative" CHECK ("slot_capacity"."capacity" >= 0)
);
--> statement-breakpoint
CREATE INDEX "reservations_slot_idx" ON "reservations" USING btree ("reservation_date","reservation_time","status");--> statement-breakpoint
CREATE INDEX "reservations_status_created_idx" ON "reservations" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "reservations_deposit_reference_idx" ON "reservations" USING btree ("deposit_reference");--> statement-breakpoint
CREATE INDEX "reservations_email_idx" ON "reservations" USING btree ("email");