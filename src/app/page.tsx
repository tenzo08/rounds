import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BinderApp } from "@/components/binder/BinderApp";
import { SignInScreen } from "@/components/SignInScreen";
import type {
  GroupSummaryDTO,
  NoteDTO,
  SharedWithMeNoteDTO,
  SubjectSummaryDTO,
} from "@/lib/types";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return <SignInScreen />;
  }

  const userId = session.user.id;

  const [me, notes, subjects, sharedWithMeRows, myMemberships] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.note.findMany({
      where: { ownerId: userId },
      include: {
        folder: { include: { topic: { include: { subject: true } } } },
        shares: { include: { group: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.subject.findMany({
      where: { ownerId: userId },
      include: {
        topics: {
          include: {
            folders: { include: { _count: { select: { notes: true } } } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    // Notes owned by someone else, shared into any group this user belongs to.
    prisma.noteShare.findMany({
      where: {
        group: { memberships: { some: { userId } } },
        note: { ownerId: { not: userId } },
      },
      include: {
        note: {
          include: { owner: true, folder: { include: { topic: { include: { subject: true } } } } },
        },
        group: true,
      },
    }),
    prisma.groupMembership.findMany({
      where: { userId },
      include: { group: { include: { _count: { select: { memberships: true } } } } },
      orderBy: { joinedAt: "desc" },
    }),
  ]);

  const noteDTOs: NoteDTO[] = notes.map((note) => ({
    id: note.id,
    subject: note.folder.topic.subject.name,
    topic: note.folder.topic.name,
    folder: note.folder.name,
    focus: note.focus,
    description: note.description,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    sharedGroups: note.shares.map((s) => s.group.name),
  }));

  const subjectDTOs: SubjectSummaryDTO[] = subjects.map((s) => ({
    name: s.name,
    count: s.topics.reduce(
      (sum, t) => sum + t.folders.reduce((fSum, f) => fSum + f._count.notes, 0),
      0,
    ),
    topics: s.topics
      .map((t) => ({
        name: t.name,
        count: t.folders.reduce((sum, f) => sum + f._count.notes, 0),
        folders: t.folders
          .map((f) => ({ name: f.name, count: f._count.notes }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));

  const sharedWithMeByNoteId = new Map<string, SharedWithMeNoteDTO>();
  for (const share of sharedWithMeRows) {
    const existing = sharedWithMeByNoteId.get(share.note.id);
    if (existing) {
      existing.groupNames.push(share.group.name);
      continue;
    }
    sharedWithMeByNoteId.set(share.note.id, {
      id: share.note.id,
      subject: share.note.folder.topic.subject.name,
      topic: share.note.folder.topic.name,
      folder: share.note.folder.name,
      focus: share.note.focus,
      description: share.note.description,
      updatedAt: share.note.updatedAt.toISOString(),
      authorId: share.note.ownerId,
      authorName: share.note.owner.displayName,
      authorImage: share.note.owner.avatarUrl,
      groupNames: [share.group.name],
    });
  }
  const sharedWithMe = Array.from(sharedWithMeByNoteId.values());

  const groups: GroupSummaryDTO[] = myMemberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    role: m.role,
    memberCount: m.group._count.memberships,
  }));

  return (
    <BinderApp
      notes={noteDTOs}
      subjects={subjectDTOs}
      sharedWithMe={sharedWithMe}
      groups={groups}
      userName={me.displayName}
      userEmail={me.email}
      userImage={me.avatarUrl}
      hasOnboarded={me.hasOnboarded}
    />
  );
}
