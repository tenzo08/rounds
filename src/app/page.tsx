import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BinderApp } from "@/components/binder/BinderApp";
import { SignInScreen } from "@/components/SignInScreen";
import type {
  NoteDTO,
  SharedWithMeNoteDTO,
  TopicSummaryDTO,
} from "@/lib/types";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return <SignInScreen />;
  }

  const userId = session.user.id;

  const [me, notes, topics, sharedWithMeRows] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.note.findMany({
      where: { ownerId: userId },
      include: { topic: true, shares: { include: { group: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.topic.findMany({
      where: { ownerId: userId },
      include: { _count: { select: { notes: true } } },
      orderBy: { name: "asc" },
    }),
    // Notes owned by someone else, shared into any group this user belongs to.
    prisma.noteShare.findMany({
      where: {
        group: { memberships: { some: { userId } } },
        note: { ownerId: { not: userId } },
      },
      include: { note: { include: { owner: true, topic: true } }, group: true },
    }),
  ]);

  const noteDTOs: NoteDTO[] = notes.map((note) => ({
    id: note.id,
    title: note.title,
    topic: note.topic.name,
    body: note.body,
    tags: note.tags,
    link: note.link,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    sharedGroups: note.shares.map((s) => s.group.name),
  }));

  const topicDTOs: TopicSummaryDTO[] = topics.map((t) => ({
    name: t.name,
    count: t._count.notes,
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
      title: share.note.title,
      topic: share.note.topic.name,
      body: share.note.body,
      tags: share.note.tags,
      link: share.note.link,
      updatedAt: share.note.updatedAt.toISOString(),
      authorId: share.note.ownerId,
      authorName: share.note.owner.displayName,
      authorImage: share.note.owner.avatarUrl,
      groupNames: [share.group.name],
    });
  }
  const sharedWithMe = Array.from(sharedWithMeByNoteId.values());

  return (
    <BinderApp
      notes={noteDTOs}
      topics={topicDTOs}
      sharedWithMe={sharedWithMe}
      userName={me.displayName}
      userEmail={me.email}
      userImage={me.avatarUrl}
    />
  );
}
