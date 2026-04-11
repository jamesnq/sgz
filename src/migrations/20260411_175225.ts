import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "category_groups_rels_categories_id_idx";
  CREATE INDEX "category_groups_rels_categories_id_idx" ON "category_groups_rels" USING btree ("categories_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "category_groups_rels_categories_id_idx";
  CREATE UNIQUE INDEX "category_groups_rels_categories_id_idx" ON "category_groups_rels" USING btree ("categories_id","path");`)
}
