-- ========= Enums (존재하지 않으면 생성) =========
DO $$ BEGIN
  CREATE TYPE "UserGroupRole" AS ENUM ('MEMBER', 'MANAGER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'LEFT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ========= groups: group_img_path 추가 =========
ALTER TABLE "groups"
  ADD COLUMN IF NOT EXISTS "group_img_path" VARCHAR(255);

-- ========= post_images: (키만 저장 → 단순 복사) 안전 전환 =========

-- 1) 우선 NULL 허용으로 추가 (이미 있으면 생략)
ALTER TABLE "post_images"
  ADD COLUMN IF NOT EXISTS "post_img_path" VARCHAR(255);

-- 2) 값 이관: 기존에도 "키"만 저장했다면 그대로 복사
UPDATE "post_images"
SET "post_img_path" = "post_img_url"
WHERE "post_img_path" IS NULL
  AND "post_img_url" IS NOT NULL;

-- 3) UNIQUE 인덱스(중복 있으면 실패) - 우선 시도
CREATE UNIQUE INDEX IF NOT EXISTS "post_images_post_img_path_key"
  ON "post_images"("post_img_path");

-- 4) 이제 NOT NULL 제약 강화
ALTER TABLE "post_images"
  ALTER COLUMN "post_img_path" SET NOT NULL;

-- 5) URL 컬럼/인덱스 제거
DROP INDEX IF EXISTS "post_images_post_img_url_key";
ALTER TABLE "post_images"
  DROP COLUMN IF EXISTS "post_img_url";

-- ========= user_groups: status/left_at/role(enum) =========

-- 1) left_at / status 추가
ALTER TABLE "user_groups"
  ADD COLUMN IF NOT EXISTS "left_at" TIMESTAMP(3);

ALTER TABLE "user_groups"
  ADD COLUMN IF NOT EXISTS "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING';

-- 2) role을 enum으로 전환(기존 값 보존)
--    임시 enum 컬럼 추가
ALTER TABLE "user_groups"
  ADD COLUMN IF NOT EXISTS "role_tmp" "UserGroupRole" NOT NULL DEFAULT 'MEMBER';

--    기존 role 값을 enum으로 매핑 (기존 타입이 text/enum 무엇이든 문자열 비교)
UPDATE "user_groups"
SET "role_tmp" = CASE
  WHEN LOWER(CAST("role" AS TEXT)) = 'manager' THEN 'MANAGER'::"UserGroupRole"
  ELSE 'MEMBER'::"UserGroupRole"
END
WHERE "role" IS NOT NULL;

--    기존 role 컬럼 제거 후 임시 컬럼을 role로 교체
ALTER TABLE "user_groups" DROP COLUMN IF EXISTS "role";
ALTER TABLE "user_groups" RENAME COLUMN "role_tmp" TO "role";

-- ========= 인덱스들 =========
CREATE INDEX IF NOT EXISTS "post_likes_post_id_idx" ON "post_likes"("post_id");
CREATE INDEX IF NOT EXISTS "user_groups_group_id_status_idx" ON "user_groups"("group_id", "status");
CREATE INDEX IF NOT EXISTS "user_groups_user_id_status_idx" ON "user_groups"("user_id", "status");
CREATE INDEX IF NOT EXISTS "user_groups_group_id_idx" ON "user_groups"("group_id");
CREATE INDEX IF NOT EXISTS "user_groups_user_id_idx" ON "user_groups"("user_id");
