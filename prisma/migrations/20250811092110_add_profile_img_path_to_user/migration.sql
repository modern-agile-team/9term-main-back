-- DropIndex
DROP INDEX "post_images_post_img_path_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profile_img_path" VARCHAR(255);
