-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('super_admin', 'editor');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "AttributeDataType" AS ENUM ('text', 'number', 'boolean', 'enum', 'multi_enum');

-- CreateEnum
CREATE TYPE "FulfillmentChannel" AS ENUM ('trendyol', 'onsite');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateTable
CREATE TABLE "admin_user" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'editor',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" UUID NOT NULL,
    "admin_user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "family_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" UUID,
    "image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "og_image" TEXT,
    "canonical_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_definition" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "data_type" "AttributeDataType" NOT NULL,
    "unit" TEXT,
    "options" JSONB,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_filterable" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attribute_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_description" TEXT,
    "description" TEXT,
    "brand" TEXT NOT NULL DEFAULT 'Lotusorium',
    "sku" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "trendyol_url" TEXT,
    "fulfillment_channel" "FulfillmentChannel" NOT NULL DEFAULT 'trendyol',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "featured_sort_order" INTEGER,
    "price_amount" DECIMAL(12,2),
    "price_currency" VARCHAR(3),
    "meta_title" TEXT,
    "meta_description" TEXT,
    "og_image" TEXT,
    "canonical_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_image" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "cloudinary_public_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redirect_click" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "clicked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,
    "user_agent" TEXT,
    "ip_hash" TEXT,
    "session_id" TEXT,

    CONSTRAINT "redirect_click_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_click_stats" (
    "product_id" UUID NOT NULL,
    "total_clicks" INTEGER NOT NULL DEFAULT 0,
    "clicks_7d" INTEGER NOT NULL DEFAULT 0,
    "clicks_30d" INTEGER NOT NULL DEFAULT 0,
    "last_clicked_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_click_stats_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "blog_post" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT,
    "cover_image_url" TEXT,
    "author_id" UUID,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "meta_title" TEXT,
    "meta_description" TEXT,
    "og_image" TEXT,
    "canonical_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_email_key" ON "admin_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_token_admin_user_id_idx" ON "refresh_token"("admin_user_id");

-- CreateIndex
CREATE INDEX "refresh_token_family_id_idx" ON "refresh_token"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- CreateIndex
CREATE INDEX "category_parent_id_idx" ON "category"("parent_id");

-- CreateIndex
CREATE INDEX "attribute_definition_category_id_idx" ON "attribute_definition"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_definition_category_id_key_key" ON "attribute_definition"("category_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "product_slug_key" ON "product"("slug");

-- CreateIndex
CREATE INDEX "product_category_id_idx" ON "product"("category_id");

-- CreateIndex
CREATE INDEX "product_status_idx" ON "product"("status");

-- CreateIndex
CREATE INDEX "product_is_featured_featured_sort_order_idx" ON "product"("is_featured", "featured_sort_order");

-- CreateIndex
CREATE INDEX "product_image_product_id_idx" ON "product_image"("product_id");

-- CreateIndex
CREATE INDEX "redirect_click_product_id_idx" ON "redirect_click"("product_id");

-- CreateIndex
CREATE INDEX "redirect_click_clicked_at_idx" ON "redirect_click"("clicked_at");

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_slug_key" ON "blog_post"("slug");

-- CreateIndex
CREATE INDEX "blog_post_status_published_at_idx" ON "blog_post"("status", "published_at");

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_definition" ADD CONSTRAINT "attribute_definition_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_image" ADD CONSTRAINT "product_image_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redirect_click" ADD CONSTRAINT "redirect_click_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_click_stats" ADD CONSTRAINT "product_click_stats_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "admin_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
