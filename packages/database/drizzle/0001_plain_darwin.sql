ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" varchar(24);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "instagram_url" varchar(255);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
