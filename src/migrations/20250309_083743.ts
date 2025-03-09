import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "product_variants" ADD COLUMN "metadata" jsonb;
  ALTER TABLE "products" DROP COLUMN IF EXISTS "metadata";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "metadata" jsonb;
  ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "metadata";`)
}
