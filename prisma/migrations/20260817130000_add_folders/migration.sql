-- Insert a Folder layer between Topic and Note (Topic -> Folder -> Note),
-- per product decision that every note lives inside a student-named folder
-- (e.g. "Prelims", "Midterms") within its topic. Notes table is currently
-- empty (previous migration emptied it), so no data to carry over.
DELETE FROM "notes";

-- CreateTable
CREATE TABLE "folders" (
    "id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "folders_topic_id_name_key" ON "folders"("topic_id", "name");

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: swap notes.topic_id for notes.folder_id
ALTER TABLE "notes" DROP CONSTRAINT "notes_topic_id_fkey";
DROP INDEX "notes_topic_id_idx";
ALTER TABLE "notes" DROP COLUMN "topic_id",
ADD COLUMN     "folder_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "notes_folder_id_idx" ON "notes"("folder_id");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
