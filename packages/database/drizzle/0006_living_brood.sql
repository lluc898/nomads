CREATE TYPE "public"."affiliate_link_status" AS ENUM('pending_review', 'monetized');--> statement-breakpoint
CREATE TYPE "public"."trip_link_type" AS ENUM('flight', 'accommodation');--> statement-breakpoint
CREATE TABLE "trip_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"type" "trip_link_type" NOT NULL,
	"original_url" text NOT NULL,
	"affiliate_url" text,
	"affiliate_status" "affiliate_link_status" DEFAULT 'pending_review' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_links" ADD CONSTRAINT "trip_links_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trip_links_trip_id_position_idx" ON "trip_links" USING btree ("trip_id","position");--> statement-breakpoint
CREATE INDEX "trips_creator_id_idx" ON "trips" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "trips_status_departure_idx" ON "trips" USING btree ("status","departure_date");--> statement-breakpoint
CREATE INDEX "trips_origin_country_idx" ON "trips" USING btree ("origin_country_code");--> statement-breakpoint
CREATE INDEX "trips_destination_country_idx" ON "trips" USING btree ("destination_country_code");