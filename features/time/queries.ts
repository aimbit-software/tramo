import "server-only";

import { recentDescriptions } from "@/features/time/timer";
import { prisma } from "@/lib/db";

/** Everything the timer page needs for one person in one workspace. */
export async function getTimerPageData(userId: string, workspaceId: string) {
  const [projects, running, recent] = await Promise.all([
    // Where this person can log time: live projects they track.
    prisma.project.findMany({
      where: { workspaceId, archivedAt: null, members: { some: { userId, role: "TRACKER" } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.timeEntry.findFirst({
      where: { userId, endedAt: null, project: { workspaceId } },
      select: {
        projectId: true,
        description: true,
        startedAt: true,
        project: { select: { name: true, color: true } },
      },
    }),
    prisma.timeEntry.findMany({
      where: { userId, endedAt: { not: null }, project: { workspaceId } },
      orderBy: { startedAt: "desc" },
      take: 8,
      select: {
        id: true,
        description: true,
        startedAt: true,
        endedAt: true,
        source: true,
        editedAt: true,
        project: { select: { name: true, color: true } },
      },
    }),
  ]);

  const suggestions = await recentDescriptions(
    prisma,
    userId,
    projects.map((project) => project.id),
  );

  return {
    projects,
    running: running
      ? {
          projectId: running.projectId,
          description: running.description,
          startedAt: running.startedAt.toISOString(),
          projectName: running.project.name,
          projectColor: running.project.color,
        }
      : null,
    recent,
    suggestions,
    // The server's clock, so the client can correct its own when computing
    // the elapsed time (a laptop clock a few minutes off shouldn't show up).
    serverNow: Date.now(),
  };
}

export type TimerPageData = Awaited<ReturnType<typeof getTimerPageData>>;
