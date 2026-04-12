import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "product_variants" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "product_variants" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "product_variants" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "product_variants_meta_meta_image_idx" ON "product_variants" USING btree ("meta_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_meta_image_id_media_id_fk";
  
  DROP INDEX "product_variants_meta_meta_image_idx";
  ALTER TABLE "product_variants" DROP COLUMN "meta_title";
  ALTER TABLE "product_variants" DROP COLUMN "meta_description";
  ALTER TABLE "product_variants" DROP COLUMN "meta_image_id";`)
}
