-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM ('NORMAL', 'ANNOUNCEMENT');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "category" "PostCategory" NOT NULL DEFAULT 'NORMAL';

-- CreateTable
CREATE TABLE "post_images" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "post_img_url" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "post_images_post_id_post_img_url_key" ON "post_images"("post_id", "post_img_url");

-- AddForeignKey
ALTER TABLE "post_images" ADD CONSTRAINT "post_images_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
