-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "topic_id" TEXT,
ALTER COLUMN "category" DROP NOT NULL;

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topics_owner_id_name_key" ON "topics"("owner_id", "name");

-- CreateIndex
CREATE INDEX "notes_topic_id_idx" ON "notes"("topic_id");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
