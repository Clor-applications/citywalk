CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
CREATE TABLE "areas" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"pay_min" integer,
	"pay_max" integer,
	"pay_period" text,
	"state" text DEFAULT 'published' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_by_user_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"category" text DEFAULT 'place' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"address" text,
	"lng" double precision NOT NULL,
	"lat" double precision NOT NULL,
	"location" geometry(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED,
	"area_id" text NOT NULL,
	"osm_id" bigint,
	"source" text DEFAULT 'citywalk' NOT NULL,
	"source_licence" text DEFAULT '' NOT NULL,
	"attribution" text DEFAULT '' NOT NULL,
	"verification" text DEFAULT 'mapped' NOT NULL,
	"last_confirmed_at" timestamp with time zone,
	"claimed_by_user_id" uuid,
	"is_demo" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"headline" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"skills" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"open_to" text DEFAULT '' NOT NULL,
	"area_id" text NOT NULL,
	"discoverable" boolean DEFAULT false NOT NULL,
	"visibility_scope" text DEFAULT 'area' NOT NULL,
	"consent_version" text DEFAULT '2026-11' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"state" text DEFAULT 'sent' NOT NULL,
	"from_user_id" uuid NOT NULL,
	"to_user_id" uuid,
	"place_id" uuid,
	"opportunity_id" uuid,
	"message" text DEFAULT '' NOT NULL,
	"response_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'professional' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_claimed_by_user_id_users_id_fk" FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "login_codes_email_created_idx" ON "login_codes" USING btree ("email","created_at");--> statement-breakpoint
CREATE INDEX "opportunities_place_state_idx" ON "opportunities" USING btree ("place_id","state");--> statement-breakpoint
CREATE INDEX "opportunities_kind_state_idx" ON "opportunities" USING btree ("kind","state");--> statement-breakpoint
CREATE UNIQUE INDEX "places_slug_unique" ON "places" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "places_osm_id_unique" ON "places" USING btree ("osm_id");--> statement-breakpoint
CREATE INDEX "places_area_kind_idx" ON "places" USING btree ("area_id","kind");--> statement-breakpoint
CREATE INDEX "places_location_gist" ON "places" USING gist ("location");--> statement-breakpoint
CREATE INDEX "profiles_area_discoverable_idx" ON "profiles" USING btree ("area_id","discoverable");--> statement-breakpoint
CREATE INDEX "requests_from_idx" ON "requests" USING btree ("from_user_id","created_at");--> statement-breakpoint
CREATE INDEX "requests_to_idx" ON "requests" USING btree ("to_user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "requests_open_pair_unique" ON "requests" USING btree ("from_user_id","to_user_id","kind") WHERE state in ('sent', 'accepted') and to_user_id is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "requests_open_opportunity_unique" ON "requests" USING btree ("from_user_id","opportunity_id") WHERE state in ('sent', 'accepted') and opportunity_id is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");