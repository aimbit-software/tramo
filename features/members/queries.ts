import "server-only";

import { prisma } from "@/lib/db";

/** Everyone in the workspace, in the order they joined. */
export function listMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      status: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

/** Invitations nobody has used yet, newest first. */
export function listOpenInvitations(workspaceId: string) {
  return prisma.invitation.findMany({
    where: { workspaceId, acceptedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true },
  });
}
