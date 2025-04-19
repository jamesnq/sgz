import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "category_groups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"icon" varchar DEFAULT 'box' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "category_groups_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "category_groups_id" integer;
  DO $$ BEGIN
   ALTER TABLE "category_groups_rels" ADD CONSTRAINT "category_groups_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."category_groups"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "category_groups_rels" ADD CONSTRAINT "category_groups_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "category_groups_updated_at_idx" ON "category_groups" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "category_groups_created_at_idx" ON "category_groups" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "category_groups_rels_order_idx" ON "category_groups_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "category_groups_rels_parent_idx" ON "category_groups_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "category_groups_rels_path_idx" ON "category_groups_rels" USING btree ("path");
  CREATE UNIQUE INDEX IF NOT EXISTS "category_groups_rels_categories_id_idx" ON "category_groups_rels" USING btree ("categories_id","path");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_category_groups_fk" FOREIGN KEY ("category_groups_id") REFERENCES "public"."category_groups"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_category_groups_id_idx" ON "payload_locked_documents_rels" USING btree ("category_groups_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "category_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "category_groups_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "category_groups" CASCADE;
  DROP TABLE "category_groups_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_category_groups_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_category_groups_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "category_groups_id";`)
}
