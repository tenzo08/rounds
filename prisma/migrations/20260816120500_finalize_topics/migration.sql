-- AlterTable
ALTER TABLE "notes" DROP COLUMN "category",
ALTER COLUMN "topic_id" SET NOT NULL;

-- DropEnum
DROP TYPE "Category";
