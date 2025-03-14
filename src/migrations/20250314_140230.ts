import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_product_variants_status" ADD VALUE 'PRIVATE';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "public"."product_variants" ALTER COLUMN "status" SET DATA TYPE text;
  DROP TYPE "public"."enum_product_variants_status";
  CREATE TYPE "public"."enum_product_variants_status" AS ENUM('ORDER', 'AVAILABLE', 'STOPPED');
  ALTER TABLE "public"."product_variants" ALTER COLUMN "status" SET DATA TYPE "public"."enum_product_variants_status" USING "status"::"public"."enum_product_variants_status";`)
}
