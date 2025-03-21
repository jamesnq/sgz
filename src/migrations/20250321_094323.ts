import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_product_variants_auto_process" AS ENUM('key');
  CREATE TABLE IF NOT EXISTS "stocks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" integer,
  	"product_variant_id" integer NOT NULL,
  	"data" jsonb NOT NULL,
  	"expired_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "product_variants" ADD COLUMN "auto_process" "enum_product_variants_auto_process";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "stocks_id" integer;
  DO $$ BEGIN
   ALTER TABLE "stocks" ADD CONSTRAINT "stocks_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "stocks" ADD CONSTRAINT "stocks_product_variant_id_product_variants_id_fk" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "stocks_order_idx" ON "stocks" USING btree ("order_id");
  CREATE INDEX IF NOT EXISTS "stocks_product_variant_idx" ON "stocks" USING btree ("product_variant_id");
  CREATE INDEX IF NOT EXISTS "stocks_updated_at_idx" ON "stocks" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "stocks_created_at_idx" ON "stocks" USING btree ("created_at");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stocks_fk" FOREIGN KEY ("stocks_id") REFERENCES "public"."stocks"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_stocks_id_idx" ON "payload_locked_documents_rels" USING btree ("stocks_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "stocks" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "stocks" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_stocks_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_stocks_id_idx";
  ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "auto_process";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "stocks_id";
  DROP TYPE "public"."enum_product_variants_auto_process";`)
}
