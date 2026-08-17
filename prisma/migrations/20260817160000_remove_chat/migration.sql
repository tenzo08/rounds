-- Chat feature removed — drop the messages table and its Realtime wiring.
-- note_shares/group_memberships RLS + publication membership stay in place;
-- those still back the group auto-refresh feature.
ALTER PUBLICATION "supabase_realtime" DROP TABLE "messages";
DROP POLICY IF EXISTS "realtime_select_messages" ON "messages";
DROP TABLE IF EXISTS "messages";
