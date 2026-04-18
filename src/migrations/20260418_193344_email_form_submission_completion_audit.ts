import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_submissions" ADD COLUMN "completed_order_id" integer;
  ALTER TABLE "form_submissions" ADD COLUMN "completed_at" timestamp(3) with time zone;
  ALTER TABLE "form_submissions" ADD COLUMN "completed_by_id" integer;
  ALTER TABLE "form_submissions" ADD COLUMN "order_status_at_completion" varchar;
  ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_completed_order_id_orders_id_fk" FOREIGN KEY ("completed_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_completed_by_id_users_id_fk" FOREIGN KEY ("completed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "form_submissions_completed_order_idx" ON "form_submissions" USING btree ("completed_order_id");
  CREATE INDEX "form_submissions_completed_by_idx" ON "form_submissions" USING btree ("completed_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_submissions" DROP CONSTRAINT "form_submissions_completed_order_id_orders_id_fk";
  
  ALTER TABLE "form_submissions" DROP CONSTRAINT "form_submissions_completed_by_id_users_id_fk";
  
  DROP INDEX "form_submissions_completed_order_idx";
  DROP INDEX "form_submissions_completed_by_idx";
  ALTER TABLE "form_submissions" DROP COLUMN "completed_order_id";
  ALTER TABLE "form_submissions" DROP COLUMN "completed_at";
  ALTER TABLE "form_submissions" DROP COLUMN "completed_by_id";
  ALTER TABLE "form_submissions" DROP COLUMN "order_status_at_completion";`)
}
