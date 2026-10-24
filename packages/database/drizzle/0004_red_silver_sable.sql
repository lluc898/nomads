CREATE TABLE "location_catalog_imports" (
	"dataset" varchar(64) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
