-- Pivot notes to a flashcard shape (title/topic/focus/description) per product
-- decision; old body/tags/link content is intentionally discarded (confirmed).
DELETE FROM "notes";

-- AlterTable
ALTER TABLE "notes" DROP COLUMN "body",
DROP COLUMN "tags",
DROP COLUMN "link",
ADD COLUMN     "focus" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL;
