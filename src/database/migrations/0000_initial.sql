CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"avatar" text,
	"google_access_token" text,
	"google_refresh_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "workflows" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"sheet_id" varchar(255),
	"sheet_name" varchar(500),
	"trello_board_id" varchar(255) NOT NULL,
	"trello_list_id" varchar(255) NOT NULL,
	"use_n8n" text DEFAULT 'false',
	"n8n_webhook_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "cards_log" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" text NOT NULL,
	"card_id" varchar(255),
	"title" varchar(500) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "workflows" ADD CONSTRAINT "workflows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "cards_log" ADD CONSTRAINT "cards_log_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "workflows_user_id_idx" ON "workflows" ("user_id");
CREATE INDEX IF NOT EXISTS "cards_log_workflow_id_idx" ON "cards_log" ("workflow_id");

