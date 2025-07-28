/*
  Warnings:

  - A unique constraint covering the columns `[post_img_url]` on the table `post_images` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "post_images_post_id_post_img_url_key";

-- CreateIndex
CREATE UNIQUE INDEX "post_images_post_img_url_key" ON "post_images"("post_img_url");
