-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_group_id_created_at_idx" ON "messages"("group_id", "created_at");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Realtime wiring: our own server (running as the table owner / a superuser
-- role) always bypasses RLS for normal app reads/writes via Prisma — these
-- policies only gate the Supabase Realtime relay, which connects using a
-- short-lived custom JWT we mint ourselves (see mintGroupRealtimeToken) with
-- a "group_id" claim set only after verifying real GroupMembership. Each
-- policy just checks the row's group_id against that claim, so a token
-- minted for one group can never be used to read another group's rows, and
-- a token expires (5 minutes) and is not reissued once someone is removed
-- from the group.

ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "realtime_select_messages" ON "messages"
  FOR SELECT
  USING (group_id = (auth.jwt() ->> 'group_id'));

ALTER TABLE "note_shares" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "realtime_select_note_shares" ON "note_shares"
  FOR SELECT
  USING (group_id = (auth.jwt() ->> 'group_id'));

ALTER TABLE "group_memberships" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "realtime_select_group_memberships" ON "group_memberships"
  FOR SELECT
  USING (group_id = (auth.jwt() ->> 'group_id'));

ALTER PUBLICATION "supabase_realtime" ADD TABLE "messages";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "note_shares";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "group_memberships";
