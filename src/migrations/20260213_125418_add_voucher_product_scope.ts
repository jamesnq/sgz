import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "vouchers_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer,
  	"product_variants_id" integer
  );
  
  ALTER TABLE "orders" ADD COLUMN "voucher_id" integer;
  ALTER TABLE "orders" ADD COLUMN "voucher_discount" numeric;
  DO $$ BEGIN
   ALTER TABLE "vouchers_rels" ADD CONSTRAINT "vouchers_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."vouchers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "vouchers_rels" ADD CONSTRAINT "vouchers_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "vouchers_rels" ADD CONSTRAINT "vouchers_rels_product_variants_fk" FOREIGN KEY ("product_variants_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "vouchers_rels_order_idx" ON "vouchers_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "vouchers_rels_parent_idx" ON "vouchers_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "vouchers_rels_path_idx" ON "vouchers_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "vouchers_rels_products_id_idx" ON "vouchers_rels" USING btree ("products_id");
  CREATE INDEX IF NOT EXISTS "vouchers_rels_product_variants_id_idx" ON "vouchers_rels" USING btree ("product_variants_id");
  DO $$ BEGIN
   ALTER TABLE "orders" ADD CONSTRAINT "orders_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "orders_voucher_idx" ON "orders" USING btree ("voucher_id");

  -- Remove voucher_id from products table (scoping is now on voucher side via vouchers_rels)
  ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_voucher_id_vouchers_id_fk";
  ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_voucher_fk";
  DROP INDEX IF EXISTS "products_voucher_idx";
  DROP INDEX IF EXISTS "products_voucher_id_idx";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "voucher_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "vouchers_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "vouchers_rels" CASCADE;
  ALTER TABLE "orders" DROP CONSTRAINT "orders_voucher_id_vouchers_id_fk";
  
  DROP INDEX IF EXISTS "orders_voucher_idx";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "voucher_id";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "voucher_discount";

  -- Restore voucher_id on products
  ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "voucher_id" integer;
  CREATE INDEX IF NOT EXISTS "products_voucher_idx" ON "products" USING btree ("voucher_id");
  DO $$ BEGIN
    ALTER TABLE "products" ADD CONSTRAINT "products_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;`)
}
