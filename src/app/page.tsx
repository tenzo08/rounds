import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BinderApp } from "@/components/binder/BinderApp";
import { SignInScreen } from "@/components/SignInScreen";
import type { NoteDTO } from "@/lib/types";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return <SignInScreen />;
  }

  const notes = await prisma.note.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  const noteDTOs: NoteDTO[] = notes.map((note) => ({
    id: note.id,
    title: note.title,
    category: note.category,
    body: note.body,
    tags: note.tags,
    link: note.link,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  }));

  return (
    <BinderApp
      notes={noteDTOs}
      userName={session.user.name ?? session.user.email ?? "You"}
      userEmail={session.user.email ?? ""}
      userImage={session.user.image ?? null}
    />
  );
}
