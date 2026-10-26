CREATE TYPE "public"."trip_participant_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "trip_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "trip_participant_status" NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	"responded_by" uuid
);
--> statement-breakpoint
ALTER TABLE "trip_participants" ADD CONSTRAINT "trip_participants_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_participants" ADD CONSTRAINT "trip_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_participants" ADD CONSTRAINT "trip_participants_responded_by_users_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "trip_participants_trip_user_uidx" ON "trip_participants" USING btree ("trip_id","user_id");--> statement-breakpoint
CREATE INDEX "trip_participants_user_status_idx" ON "trip_participants" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "trip_participants_trip_status_idx" ON "trip_participants" USING btree ("trip_id","status");