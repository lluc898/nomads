ALTER TABLE "notifications" ADD COLUMN "join_request_id" uuid;--> statement-breakpoint
UPDATE "notifications" n
SET "join_request_id" = tp."id"
FROM "trip_participants" tp
WHERE n."type" = 'join_request'
  AND n."trip_id" = tp."trip_id"
  AND n."actor_id" = tp."user_id"
  AND tp."status" = 'pending';--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_join_request_id_trip_participants_id_fk" FOREIGN KEY ("join_request_id") REFERENCES "public"."trip_participants"("id") ON DELETE set null ON UPDATE no action;
