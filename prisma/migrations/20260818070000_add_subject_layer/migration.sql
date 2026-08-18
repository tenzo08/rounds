-- Insert a Subject layer above Topic (Subject -> Topic -> Folder -> Note),
-- and drop the flashcard's separate "title" field — the Topic now plays
-- that role. Applied against a freshly wiped database (all data reset at
-- the user's request rather than migrating it), so this is a
-- straightforward schema change with no data to preserve/reshuffle.

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subjects_owner_id_name_key" ON "subjects"("owner_id", "name");

ALTER TABLE "subjects" ADD CONSTRAINT "subjects_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Topic now belongs to Subject instead of User directly.
ALTER TABLE "topics" DROP CONSTRAINT "topics_owner_id_fkey";
DROP INDEX "topics_owner_id_name_key";
ALTER TABLE "topics" DROP COLUMN "owner_id",
ADD COLUMN "subject_id" TEXT NOT NULL;

CREATE UNIQUE INDEX "topics_subject_id_name_key" ON "topics"("subject_id", "name");

ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_fkey"
    FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: drop the flashcard's separate title field.
ALTER TABLE "notes" DROP COLUMN "title";
