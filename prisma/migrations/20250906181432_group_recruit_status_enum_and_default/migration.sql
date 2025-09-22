-- CreateEnum
CREATE TYPE "GroupRecruitStatus" AS ENUM ('RECRUITING', 'ALWAYS_OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "recruitStatus" "GroupRecruitStatus" NOT NULL DEFAULT 'RECRUITING';
