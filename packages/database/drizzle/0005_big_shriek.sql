ALTER TABLE "trips" ADD COLUMN "origin_country_code" varchar(2);--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "origin_airport_id" integer;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "destination_country_code" varchar(2);--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "destination_airport_id" integer;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "destination_anywhere" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_origin_country_code_countries_code_fk" FOREIGN KEY ("origin_country_code") REFERENCES "public"."countries"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_origin_airport_id_airports_id_fk" FOREIGN KEY ("origin_airport_id") REFERENCES "public"."airports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_destination_country_code_countries_code_fk" FOREIGN KEY ("destination_country_code") REFERENCES "public"."countries"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_destination_airport_id_airports_id_fk" FOREIGN KEY ("destination_airport_id") REFERENCES "public"."airports"("id") ON DELETE no action ON UPDATE no action;