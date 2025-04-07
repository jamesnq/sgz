import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "min_price" numeric DEFAULT 0 NOT NULL;
  ALTER TABLE "products" ADD COLUMN "max_price" numeric DEFAULT 0 NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN IF EXISTS "min_price";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "max_price";`)
}
