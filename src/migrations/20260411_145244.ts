import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Create enum type if not exists
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_category_groups_sort_products" AS ENUM('-sold', '-createdAt', '-updatedAt');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)

  // Add enum value if not exists
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TYPE "public"."enum_product_variants_auto_process" ADD VALUE IF NOT EXISTS 'direct';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)

  // Drop users_sessions if exists
  await db.execute(sql`
    DROP TABLE IF EXISTS "users_sessions" CASCADE;
  `)

  // Add columns if not exists
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "category_groups" ADD COLUMN "slug" varchar NOT NULL DEFAULT '';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "category_groups" ADD COLUMN "show_on_homepage" boolean DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "category_groups" ADD COLUMN "homepage_subtitle" varchar;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "category_groups" ADD COLUMN "sort_order" numeric DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "category_groups" ADD COLUMN "sort_products" "enum_category_groups_sort_products" DEFAULT '-sold';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "category_groups" ADD COLUMN "homepage_limit" numeric DEFAULT 12;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `)

  // Create index if not exists
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "category_groups_slug_idx" ON "category_groups" USING btree ("slug");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  ALTER TABLE "product_variants" ALTER COLUMN "auto_process" SET DATA TYPE text;
  DROP TYPE "public"."enum_product_variants_auto_process";
  CREATE TYPE "public"."enum_product_variants_auto_process" AS ENUM('key');
  ALTER TABLE "product_variants" ALTER COLUMN "auto_process" SET DATA TYPE "public"."enum_product_variants_auto_process" USING "auto_process"::"public"."enum_product_variants_auto_process";
  DROP INDEX "category_groups_slug_idx";
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  ALTER TABLE "category_groups" DROP COLUMN "slug";
  ALTER TABLE "category_groups" DROP COLUMN "show_on_homepage";
  ALTER TABLE "category_groups" DROP COLUMN "homepage_subtitle";
  ALTER TABLE "category_groups" DROP COLUMN "sort_order";
  ALTER TABLE "category_groups" DROP COLUMN "sort_products";
  ALTER TABLE "category_groups" DROP COLUMN "homepage_limit";
  DROP TYPE "public"."enum_category_groups_sort_products";`)
}
