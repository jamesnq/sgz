import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Add missing voucher columns to products and orders tables
  // These were accidentally omitted from the 20260207_160718_add_vouchers migration
  await db.execute(sql`
  ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "voucher_id" integer;
  ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "voucher_id" integer;
  ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "voucher_discount" numeric;

  CREATE INDEX IF NOT EXISTS "products_voucher_idx" ON "products" USING btree ("voucher_id");
  CREATE INDEX IF NOT EXISTS "orders_voucher_idx" ON "orders" USING btree ("voucher_id");

  DO $$ BEGIN
   ALTER TABLE "products" ADD CONSTRAINT "products_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "orders" ADD CONSTRAINT "orders_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_voucher_id_vouchers_id_fk";
  ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_voucher_id_vouchers_id_fk";

  DROP INDEX IF EXISTS "products_voucher_idx";
  DROP INDEX IF EXISTS "orders_voucher_idx";

  ALTER TABLE "products" DROP COLUMN IF EXISTS "voucher_id";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "voucher_id";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "voucher_discount";`)
}
