CREATE TYPE "public"."message_kind" AS ENUM('message', 'system');--> statement-breakpoint
ALTER TYPE "public"."trip_participant_status" ADD VALUE 'left';--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "kind" "message_kind" DEFAULT 'message' NOT NULL;
