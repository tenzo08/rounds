import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignInScreen } from "@/components/SignInScreen";
import { GroupDetailClient } from "@/components/groups/GroupDetailClient";
import type {
  GroupDetailDTO,
  GroupFeedNoteDTO,
  GroupSummaryDTO,
} from "@/lib/types";

interface GroupDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({
  params,
}: GroupDetailPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return <SignInScreen />;
  }

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      memberships: {
        include: { user: true },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  const currentMembership = group?.memberships.find(
    (m) => m.userId === session.user.id,
  );

  if (!group || !currentMembership) {
    notFound();
  }

  const groupDTO: GroupDetailDTO = {
    id: group.id,
    name: group.name,
    currentUserRole: currentMembership.role,
    members: group.memberships.map((m) => ({
      userId: m.userId,
      name: m.user.displayName,
      email: m.user.email,
      image: m.user.avatarUrl,
      role: m.role,
    })),
  };

  // Read access here is a direct consequence of the membership check above —
  // any member of this group can see everything shared into it.
  const shares = await prisma.noteShare.findMany({
    where: { groupId: id },
    include: { note: { include: { owner: true, topic: true } } },
    orderBy: { sharedAt: "desc" },
  });

  const feedNotes: GroupFeedNoteDTO[] = shares.map((s) => ({
    id: s.note.id,
    title: s.note.title,
    topic: s.note.topic.name,
    body: s.note.body,
    tags: s.note.tags,
    link: s.note.link,
    updatedAt: s.note.updatedAt.toISOString(),
    authorId: s.note.ownerId,
    authorName: s.note.owner.displayName,
    authorImage: s.note.owner.avatarUrl,
  }));

  const myMemberships = await prisma.groupMembership.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: { _count: { select: { memberships: true } } },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const sidebarGroups: GroupSummaryDTO[] = myMemberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    role: m.role,
    memberCount: m.group._count.memberships,
  }));

  return (
    <GroupDetailClient
      group={groupDTO}
      groups={sidebarGroups}
      feedNotes={feedNotes}
      currentUserId={session.user.id}
      userName={session.user.name ?? session.user.email ?? "You"}
      userEmail={session.user.email ?? ""}
      userImage={session.user.image ?? null}
    />
  );
}
