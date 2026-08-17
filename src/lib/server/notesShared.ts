import { prisma } from "@/lib/prisma";

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
