import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ai_configuration_provider" AS ENUM('openai', 'gemini', 'custom');
  CREATE TABLE "ai_configuration" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"provider" "enum_ai_configuration_provider" DEFAULT 'openai' NOT NULL,
  	"base_url" varchar,
  	"api_key" varchar NOT NULL,
  	"model" varchar DEFAULT 'gpt-4o-mini',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  DROP INDEX "category_groups_rels_categories_id_idx";
  CREATE INDEX "category_groups_rels_categories_id_idx" ON "category_groups_rels" USING btree ("categories_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ai_configuration" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ai_configuration" CASCADE;
  DROP INDEX "category_groups_rels_categories_id_idx";
  CREATE UNIQUE INDEX "category_groups_rels_categories_id_idx" ON "category_groups_rels" USING btree ("categories_id","path");
  DROP TYPE "public"."enum_ai_configuration_provider";`)
}
