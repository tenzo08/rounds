import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignInScreen } from "@/components/SignInScreen";
import { GroupsPageClient } from "@/components/groups/GroupsPageClient";
import type { GroupSummaryDTO } from "@/lib/types";

export default async function GroupsPage() {
  const session = await auth();

  if (!session?.user) {
    return <SignInScreen />;
  }

  const [me, memberships] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    prisma.groupMembership.findMany({
      where: { userId: session.user.id },
      include: {
        group: {
          include: { _count: { select: { memberships: true } } },
        },
      },
      orderBy: { joinedAt: "desc" },
    }),
  ]);

  const groups: GroupSummaryDTO[] = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    role: m.role,
    memberCount: m.group._count.memberships,
  }));

  return (
    <GroupsPageClient
      groups={groups}
      userName={me.displayName}
      userEmail={me.email}
      userImage={me.avatarUrl}
    />
  );
}
