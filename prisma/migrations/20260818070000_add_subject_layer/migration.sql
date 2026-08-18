-- Insert a Subject layer above Topic (Subject -> Topic -> Folder -> Note).
-- Every level shifts down one, reusing ids so no mapping table is needed:
--   old Topic row   -> new Subject row (same id)
--   old Folder row  -> new Topic row   (same id; notes.folder_id already
--                                       points at this id, so it ends up
--                                       pointing at the right new Topic)
--   fresh Prelims/Midterms/Finals folders are created under every new Topic,
--   and existing notes are moved into "Prelims".
-- The flashcard's separate "title" field is also dropped here — the Topic
-- name now plays that role.

-- Phase A: drop the two ON DELETE CASCADE fkeys that would otherwise wipe
-- out folders/notes/note_shares the moment old topics/folders rows are
-- deleted below. Re-added once each side has been rebuilt.
ALTER TABLE "folders" DROP CONSTRAINT "folders_topic_id_fkey";
ALTER TABLE "notes" DROP CONSTRAINT "notes_folder_id_fkey";

-- Phase B: old Topic -> new Subject (same ids/data).
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

INSERT INTO "subjects" ("id", "owner_id", "name", "created_at")
SELECT "id", "owner_id", "name", "created_at" FROM "topics";

CREATE UNIQUE INDEX "subjects_owner_id_name_key" ON "subjects"("owner_id", "name");

ALTER TABLE "subjects" ADD CONSTRAINT "subjects_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Phase C: rebuild Topics from the old Folders (old Folder -> new Topic).
ALTER TABLE "topics" DROP CONSTRAINT "topics_owner_id_fkey";
DROP INDEX "topics_owner_id_name_key";
ALTER TABLE "topics" DROP COLUMN "owner_id";
ALTER TABLE "topics" ADD COLUMN "subject_id" TEXT;

DELETE FROM "topics";

INSERT INTO "topics" ("id", "subject_id", "name", "created_at")
SELECT "id", "topic_id", "name", "created_at" FROM "folders";

ALTER TABLE "topics" ALTER COLUMN "subject_id" SET NOT NULL;
CREATE UNIQUE INDEX "topics_subject_id_name_key" ON "topics"("subject_id", "name");
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_fkey"
    FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Phase D: rebuild Folders as the new semester-period layer under the new
-- Topics, seeding Prelims/Midterms/Finals for every one of them, then
-- repoint every note at its new "Prelims" folder.
ALTER TABLE "notes" ADD COLUMN "_old_folder_id" TEXT;
UPDATE "notes" SET "_old_folder_id" = "folder_id";

DELETE FROM "folders";

INSERT INTO "folders" ("id", "topic_id", "name", "created_at")
SELECT gen_random_uuid()::text, "t"."id", "p"."period", CURRENT_TIMESTAMP
FROM "topics" "t" CROSS JOIN (VALUES ('Prelims'), ('Midterms'), ('Finals')) AS "p"("period");

ALTER TABLE "folders" ADD CONSTRAINT "folders_topic_id_fkey"
    FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "notes" "n"
SET "folder_id" = "f"."id"
FROM "folders" "f"
WHERE "f"."topic_id" = "n"."_old_folder_id" AND "f"."name" = 'Prelims';

ALTER TABLE "notes" DROP COLUMN "_old_folder_id";
ALTER TABLE "notes" ADD CONSTRAINT "notes_folder_id_fkey"
    FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Phase E: drop the flashcard's separate title field.
ALTER TABLE "notes" DROP COLUMN "title";
