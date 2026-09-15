CREATE TABLE "menu_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name_es" text NOT NULL,
	"name_en" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mime_type" text NOT NULL,
	"base64_data" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" text NOT NULL,
	"name_es" text NOT NULL,
	"name_en" text,
	"desc_es" text DEFAULT '' NOT NULL,
	"desc_en" text,
	"price" integer,
	"image" text,
	"subcategory_es" text,
	"subcategory_en" text,
	"available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "menu_items_price_non_negative" CHECK ("menu_items"."price" is null or "menu_items"."price" >= 0)
);
--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "menu_items_category_sort_idx" ON "menu_items" USING btree ("category_id","sort_order");