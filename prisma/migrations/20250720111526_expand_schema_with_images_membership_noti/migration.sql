/*
  Warnings:

  - The `role` column on the `user_groups` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserGroupRole" AS ENUM ('MEMBER', 'MANAGER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'LEFT');

-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM ('NORMAL', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_POST_IN_GROUP');

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "group_img_url" VARCHAR(255);

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "category" "PostCategory" NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "user_groups" ADD COLUMN     "left_at" TIMESTAMP(3),
ADD COLUMN     "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
DROP COLUMN "role",
ADD COLUMN     "role" "UserGroupRole" NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "user_img_url" VARCHAR(255);

-- CreateTable
CREATE TABLE "post_images" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "post_img_url" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "recipient_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "post_id" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" VARCHAR(100) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "post_images_post_id_post_img_url_key" ON "post_images"("post_id", "post_img_url");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_created_at_idx" ON "notifications"("recipient_id", "created_at");

-- CreateIndex
CREATE INDEX "post_likes_post_id_idx" ON "post_likes"("post_id");

-- CreateIndex
CREATE INDEX "user_groups_group_id_status_idx" ON "user_groups"("group_id", "status");

-- CreateIndex
CREATE INDEX "user_groups_user_id_status_idx" ON "user_groups"("user_id", "status");

-- AddForeignKey
ALTER TABLE "post_images" ADD CONSTRAINT "post_images_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
