CREATE TABLE "airports" (
	"id" integer PRIMARY KEY NOT NULL,
	"ident" varchar(16) NOT NULL,
	"type" varchar(32) NOT NULL,
	"name" varchar(200) NOT NULL,
	"municipality" varchar(160),
	"country_code" varchar(2) NOT NULL,
	"iata_code" varchar(3),
	"icao_code" varchar(4),
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"scheduled_service" boolean DEFAULT false NOT NULL,
	"keywords" text,
	"search_text" text NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "airports_ident_unique" UNIQUE("ident")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"code" varchar(2) PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"name_es" varchar(120) NOT NULL,
	"continent_code" varchar(2) NOT NULL,
	"keywords" text,
	"search_text" text NOT NULL,
	"airport_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "airports" ADD CONSTRAINT "airports_country_code_countries_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "airports_country_code_idx" ON "airports" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "airports_iata_code_idx" ON "airports" USING btree ("iata_code");
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX "airports_search_text_trgm_idx" ON "airports" USING gin ("search_text" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX "countries_search_text_trgm_idx" ON "countries" USING gin ("search_text" gin_trgm_ops);
