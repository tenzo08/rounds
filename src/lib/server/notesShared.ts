import { prisma } from "@/lib/prisma";
import { notifyGroupChanged } from "@/lib/server/notifyGroup";

// Topics and folders are created implicitly as a student types names on a
// note — there's no separate "manage topics/folders" screen. Every note must
// live in a folder, and every folder must live in a topic (Topic -> Folder ->
// Note). Shared by the note actions and the .md import action so both create
// topics/folders the same way.
export async function resolveFolderId(
  userId: string,
  topicName: string,
  folderName: string,
): Promise<string> {
  const topic = await prisma.topic.upsert({
    where: { ownerId_name: { ownerId: userId, name: topicName } },
    update: {},
    create: { ownerId: userId, name: topicName },
  });
  const folder = await prisma.folder.upsert({
    where: { topicId_name: { topicId: topic.id, name: folderName } },
    update: {},
    create: { topicId: topic.id, name: folderName },
  });
  return folder.id;
}

// A topic/folder that's a purely entry-driven container with no notes left
// in it shouldn't linger in the sidebar — clean up bottom-up after a note is
// deleted or moved out of a folder.
export async function cleanupIfEmpty(folderId: string): Promise<void> {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { topicId: true, _count: { select: { notes: true } } },
  });
  if (!folder || folder._count.notes > 0) return;

  await prisma.folder.delete({ where: { id: folderId } }).catch(() => {});
  const remainingFolders = await prisma.folder.count({
    where: { topicId: folder.topicId },
  });
  if (remainingFolders === 0) {
    await prisma.topic.delete({ where: { id: folder.topicId } }).catch(() => {});
  }
}

// Look up which groups a set of notes is currently shared into, before a
// mutation (edit/move/delete) that changes what those groups should see —
// call this BEFORE the mutation (the NoteShare rows may cascade-delete along
// with the note), then notify each affected group AFTER it succeeds.
export async function findAffectedGroupIds(noteIds: string[]): Promise<string[]> {
  if (noteIds.length === 0) return [];
  const shares = await prisma.noteShare.findMany({
    where: { noteId: { in: noteIds } },
    select: { groupId: true },
    distinct: ["groupId"],
  });
  return shares.map((s) => s.groupId);
}

export async function notifyGroups(groupIds: string[]): Promise<void> {
  await Promise.all(groupIds.map((id) => notifyGroupChanged(id)));
}
