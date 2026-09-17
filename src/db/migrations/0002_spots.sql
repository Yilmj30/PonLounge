CREATE TYPE "public"."spot_kind" AS ENUM('mesa', 'barra');--> statement-breakpoint
CREATE TABLE "venue_spots" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"kind" "spot_kind" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"blocked" boolean DEFAULT false NOT NULL,
	"blocked_reason" text,
	"blocked_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
