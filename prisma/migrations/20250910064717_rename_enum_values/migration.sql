/*
  Warnings:

  - The values [RECRUITING] on the enum `GroupRecruitStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GroupRecruitStatus_new" AS ENUM ('OPEN', 'ALWAYS_OPEN', 'CLOSED');
ALTER TABLE "groups" ALTER COLUMN "recruitStatus" DROP DEFAULT;
ALTER TABLE "groups" ALTER COLUMN "recruitStatus" TYPE "GroupRecruitStatus_new" USING ("recruitStatus"::text::"GroupRecruitStatus_new");
ALTER TYPE "GroupRecruitStatus" RENAME TO "GroupRecruitStatus_old";
ALTER TYPE "GroupRecruitStatus_new" RENAME TO "GroupRecruitStatus";
DROP TYPE "GroupRecruitStatus_old";
ALTER TABLE "groups" ALTER COLUMN "recruitStatus" SET DEFAULT 'OPEN';
COMMIT;

-- AlterTable
ALTER TABLE "groups" ALTER COLUMN "recruitStatus" SET DEFAULT 'OPEN';
