import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_suppliers_status" AS ENUM('ACTIVE', 'INACTIVE');
  CREATE TABLE IF NOT EXISTS "product_variant_supplies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_variant_id" integer NOT NULL,
  	"supplier_id" integer NOT NULL,
  	"cost" numeric DEFAULT 0 NOT NULL,
  	"prepaid" boolean DEFAULT false NOT NULL,
  	"purchase" numeric DEFAULT 0 NOT NULL,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "suppliers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"status" "enum_suppliers_status" DEFAULT 'ACTIVE' NOT NULL,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "product_variants" ADD COLUMN "default_supplier_id" integer;
  ALTER TABLE "orders" ADD COLUMN "supplier_id" integer;
  ALTER TABLE "orders" ADD COLUMN "supplier_paid" boolean;
  ALTER TABLE "orders" ADD COLUMN "cost" numeric;
  ALTER TABLE "orders" ADD COLUMN "revenue" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "product_variant_supplies_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "suppliers_id" integer;
  DO $$ BEGIN
   ALTER TABLE "product_variant_supplies" ADD CONSTRAINT "product_variant_supplies_product_variant_id_product_variants_id_fk" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "product_variant_supplies" ADD CONSTRAINT "product_variant_supplies_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "product_variant_supplies_product_variant_idx" ON "product_variant_supplies" USING btree ("product_variant_id");
  CREATE INDEX IF NOT EXISTS "product_variant_supplies_supplier_idx" ON "product_variant_supplies" USING btree ("supplier_id");
  CREATE INDEX IF NOT EXISTS "product_variant_supplies_updated_at_idx" ON "product_variant_supplies" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "product_variant_supplies_created_at_idx" ON "product_variant_supplies" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "productVariant_supplier_idx" ON "product_variant_supplies" USING btree ("product_variant_id","supplier_id");
  CREATE INDEX IF NOT EXISTS "suppliers_updated_at_idx" ON "suppliers" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "suppliers_created_at_idx" ON "suppliers" USING btree ("created_at");
  DO $$ BEGIN
   ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_default_supplier_id_suppliers_id_fk" FOREIGN KEY ("default_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "orders" ADD CONSTRAINT "orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_variant_supplies_fk" FOREIGN KEY ("product_variant_supplies_id") REFERENCES "public"."product_variant_supplies"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_suppliers_fk" FOREIGN KEY ("suppliers_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "product_variants_default_supplier_idx" ON "product_variants" USING btree ("default_supplier_id");
  CREATE INDEX IF NOT EXISTS "orders_supplier_idx" ON "orders" USING btree ("supplier_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "orderCode_gateway_idx" ON "recharges" USING btree ("order_code","gateway");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_variant_supplies_id_idx" ON "payload_locked_documents_rels" USING btree ("product_variant_supplies_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_suppliers_id_idx" ON "payload_locked_documents_rels" USING btree ("suppliers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "product_variant_supplies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "suppliers" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "product_variant_supplies" CASCADE;
  DROP TABLE "suppliers" CASCADE;
  ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_default_supplier_id_suppliers_id_fk";
  
  ALTER TABLE "orders" DROP CONSTRAINT "orders_supplier_id_suppliers_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_product_variant_supplies_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_suppliers_fk";
  
  DROP INDEX IF EXISTS "product_variants_default_supplier_idx";
  DROP INDEX IF EXISTS "orders_supplier_idx";
  DROP INDEX IF EXISTS "orderCode_gateway_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_product_variant_supplies_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_suppliers_id_idx";
  ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "default_supplier_id";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "supplier_id";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "supplier_paid";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "cost";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "revenue";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_variant_supplies_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "suppliers_id";
  DROP TYPE "public"."enum_suppliers_status";`)
}
