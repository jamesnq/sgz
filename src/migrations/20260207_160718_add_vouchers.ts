import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_vouchers_discount_type" AS ENUM('percentage', 'fixed');
  CREATE TABLE IF NOT EXISTS "vouchers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"discount_type" "enum_vouchers_discount_type" NOT NULL,
  	"discount_value" numeric NOT NULL,
  	"min_purchase" numeric,
  	"max_uses" numeric,
  	"used_count" numeric DEFAULT 0,
  	"start_date" timestamp(3) with time zone,
  	"expiration_date" timestamp(3) with time zone,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "vouchers_id" integer;
  CREATE UNIQUE INDEX IF NOT EXISTS "vouchers_code_idx" ON "vouchers" USING btree ("code");
  CREATE INDEX IF NOT EXISTS "vouchers_updated_at_idx" ON "vouchers" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "vouchers_created_at_idx" ON "vouchers" USING btree ("created_at");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vouchers_fk" FOREIGN KEY ("vouchers_id") REFERENCES "public"."vouchers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_vouchers_id_idx" ON "payload_locked_documents_rels" USING btree ("vouchers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "vouchers" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "vouchers" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_vouchers_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_vouchers_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "vouchers_id";
  DROP TYPE "public"."enum_vouchers_discount_type";`)
}
