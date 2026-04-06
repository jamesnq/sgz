import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_vouchers_commission_type" AS ENUM('percentage', 'fixed');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payload_jobs_fk";
  
  DROP INDEX "payload_locked_documents_rels_product_variant_supplies_id_idx";
  DROP INDEX "payload_locked_documents_rels_payload_jobs_id_idx";
  ALTER TABLE "products" ADD COLUMN "featured" boolean DEFAULT false;
  ALTER TABLE "orders" ADD COLUMN "affiliate_user_id" integer;
  ALTER TABLE "orders" ADD COLUMN "affiliate_commission" numeric;
  ALTER TABLE "orders" ADD COLUMN "affiliate_paid" boolean DEFAULT false;
  ALTER TABLE "vouchers" ADD COLUMN "affiliate_user_id" integer;
  ALTER TABLE "vouchers" ADD COLUMN "commission_type" "enum_vouchers_commission_type";
  ALTER TABLE "vouchers" ADD COLUMN "commission_value" numeric;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  ALTER TABLE "orders" ADD CONSTRAINT "orders_affiliate_user_id_users_id_fk" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_affiliate_user_id_users_id_fk" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "orders_affiliate_user_idx" ON "orders" USING btree ("affiliate_user_id");
  CREATE INDEX "vouchers_affiliate_user_idx" ON "vouchers" USING btree ("affiliate_user_id");
  CREATE INDEX "payload_locked_documents_rels_product_variant_supplies_i_idx" ON "payload_locked_documents_rels" USING btree ("product_variant_supplies_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payload_jobs_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_kv" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  ALTER TABLE "orders" DROP CONSTRAINT "orders_affiliate_user_id_users_id_fk";
  
  ALTER TABLE "vouchers" DROP CONSTRAINT "vouchers_affiliate_user_id_users_id_fk";
  
  DROP INDEX "orders_affiliate_user_idx";
  DROP INDEX "vouchers_affiliate_user_idx";
  DROP INDEX "payload_locked_documents_rels_product_variant_supplies_i_idx";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payload_jobs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_jobs_fk" FOREIGN KEY ("payload_jobs_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_product_variant_supplies_id_idx" ON "payload_locked_documents_rels" USING btree ("product_variant_supplies_id");
  CREATE INDEX "payload_locked_documents_rels_payload_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_jobs_id");
  ALTER TABLE "products" DROP COLUMN "featured";
  ALTER TABLE "orders" DROP COLUMN "affiliate_user_id";
  ALTER TABLE "orders" DROP COLUMN "affiliate_commission";
  ALTER TABLE "orders" DROP COLUMN "affiliate_paid";
  ALTER TABLE "vouchers" DROP COLUMN "affiliate_user_id";
  ALTER TABLE "vouchers" DROP COLUMN "commission_type";
  ALTER TABLE "vouchers" DROP COLUMN "commission_value";
  DROP TYPE "public"."enum_vouchers_commission_type";`)
}
