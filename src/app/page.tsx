import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BinderApp } from "@/components/binder/BinderApp";
import { SignInScreen } from "@/components/SignInScreen";
import type { NoteDTO, TopicSummaryDTO } from "@/lib/types";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return <SignInScreen />;
  }

  const [notes, topics] = await Promise.all([
    prisma.note.findMany({
      where: { ownerId: session.user.id },
      include: { topic: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.topic.findMany({
      where: { ownerId: session.user.id },
      include: { _count: { select: { notes: true } } },
      orderBy: { name: "asc" },
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
  }));

  const topicDTOs: TopicSummaryDTO[] = topics.map((t) => ({
    name: t.name,
    count: t._count.notes,
  }));

  return (
    <BinderApp
      notes={noteDTOs}
      topics={topicDTOs}
      userName={session.user.name ?? session.user.email ?? "You"}
      userEmail={session.user.email ?? ""}
      userImage={session.user.image ?? null}
    />
  );
}
