/*
  Warnings:

  - You are about to drop the column `post_img_url` on the `post_images` table. All the data in the column will be lost.
  - The `role` column on the `user_groups` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[post_img_path]` on the table `post_images` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `post_img_path` to the `post_images` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserGroupRole" AS ENUM ('MEMBER', 'MANAGER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'LEFT');

-- DropIndex
DROP INDEX "post_images_post_img_url_key";

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "group_img_path" VARCHAR(255);

-- AlterTable
ALTER TABLE "post_images" DROP COLUMN "post_img_url",
ADD COLUMN     "post_img_path" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "user_groups" ADD COLUMN     "left_at" TIMESTAMP(3),
ADD COLUMN     "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
DROP COLUMN "role",
ADD COLUMN     "role" "UserGroupRole" NOT NULL DEFAULT 'MEMBER';

-- CreateIndex
CREATE UNIQUE INDEX "post_images_post_img_path_key" ON "post_images"("post_img_path");

-- CreateIndex
CREATE INDEX "post_likes_post_id_idx" ON "post_likes"("post_id");

-- CreateIndex
CREATE INDEX "user_groups_group_id_status_idx" ON "user_groups"("group_id", "status");

-- CreateIndex
CREATE INDEX "user_groups_user_id_status_idx" ON "user_groups"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_groups_group_id_idx" ON "user_groups"("group_id");

-- CreateIndex
CREATE INDEX "user_groups_user_id_idx" ON "user_groups"("user_id");
