ALTER TABLE "countries" ADD COLUMN "hero_image_url" text;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "hero_image_source_url" text;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "hero_image_author" varchar(255);--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "hero_image_license" varchar(64);--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "hero_image_license_url" text;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "hero_image_alt" varchar(255);--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "hero_image_updated_at" timestamp with time zone;