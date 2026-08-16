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

  const memberships = await prisma.groupMembership.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: { _count: { select: { memberships: true } } },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const groups: GroupSummaryDTO[] = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    role: m.role,
    memberCount: m.group._count.memberships,
  }));

  return (
    <GroupsPageClient
      groups={groups}
      userName={session.user.name ?? session.user.email ?? "You"}
      userEmail={session.user.email ?? ""}
      userImage={session.user.image ?? null}
    />
  );
}
