import { prisma } from "@/lib/prisma";
import { notifyGroupChanged } from "@/lib/server/notifyGroup";

// Every Topic is seeded with these three exam-period folders the moment
// it's created — students can still rename them or add more of their own.
export const DEFAULT_FOLDER_NAMES = ["Prelims", "Midterms", "Finals"];

// Subjects, Topics, and Folders are all created implicitly as a student
// types names on a note — there's no separate "manage" screen for any of
// them. Every note must live in a folder, every folder in a topic, and
// every topic in a subject (Subject -> Topic -> Folder -> Note). Shared by
// the note actions and the .md import action so both build the chain the
// same way.
export async function resolveFolderId(
  userId: string,
  subjectName: string,
  topicName: string,
  folderName: string,
): Promise<string> {
  const subject = await prisma.subject.upsert({
    where: { ownerId_name: { ownerId: userId, name: subjectName } },
    update: {},
    create: { ownerId: userId, name: subjectName },
  });

  let topic = await prisma.topic.findUnique({
    where: { subjectId_name: { subjectId: subject.id, name: topicName } },
  });
  if (!topic) {
    topic = await prisma.$transaction(async (tx) => {
      const created = await tx.topic.create({
        data: { subjectId: subject.id, name: topicName },
      });
      // Seed the defaults minus whichever one the student actually asked
      // for — that one is created/reused by the upsert below either way.
      await tx.folder.createMany({
        data: DEFAULT_FOLDER_NAMES.filter((name) => name !== folderName).map(
          (name) => ({ topicId: created.id, name }),
        ),
      });
      return created;
    });
  }

  const folder = await prisma.folder.upsert({
    where: { topicId_name: { topicId: topic.id, name: folderName } },
    update: {},
    create: { topicId: topic.id, name: folderName },
  });
  return folder.id;
}

// A folder/topic/subject that's a purely entry-driven container with no
// notes left in it shouldn't linger in the sidebar — clean up bottom-up
// after a note is deleted or moved out of a folder.
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
  if (remainingFolders > 0) return;

  const topic = await prisma.topic.findUnique({
    where: { id: folder.topicId },
    select: { subjectId: true },
  });
  await prisma.topic.delete({ where: { id: folder.topicId } }).catch(() => {});
  if (!topic) return;

  const remainingTopics = await prisma.topic.count({
    where: { subjectId: topic.subjectId },
  });
  if (remainingTopics === 0) {
    await prisma.subject.delete({ where: { id: topic.subjectId } }).catch(() => {});
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
