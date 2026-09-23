import "server-only";

import { recentDescriptions } from "@/features/time/timer";
import { bucketWeek, resolveWeek } from "@/features/time/week";
import { prisma } from "@/lib/db";
import { weekRange, zonedDateKey } from "@/lib/zoned";

const ENTRY_SELECT = {
  id: true,
  projectId: true,
  description: true,
  startedAt: true,
  endedAt: true,
  source: true,
  editedAt: true,
  project: { select: { name: true, color: true } },
} as const;

/** What the entry dialog needs: where this person can log time, and their past tasks. */
async function getEntryFormData(userId: string, workspaceId: string) {
  const projects = await prisma.project.findMany({
    where: { workspaceId, archivedAt: null, members: { some: { userId, role: "TRACKER" } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });
  const suggestions = await recentDescriptions(
    prisma,
    userId,
    projects.map((project) => project.id),
  );
  return { projects, suggestions };
}

/** Everything the timer page needs for one person in one workspace. */
export async function getTimerPageData(userId: string, workspaceId: string) {
  const [form, running, recent] = await Promise.all([
    getEntryFormData(userId, workspaceId),
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
      select: ENTRY_SELECT,
    }),
  ]);

  return {
    ...form,
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
    // The server's clock, so the client can correct its own when computing
    // the elapsed time (a laptop clock a few minutes off shouldn't show up).
    serverNow: Date.now(),
  };
}

export type TimerPageData = Awaited<ReturnType<typeof getTimerPageData>>;

/** One person's week: the blocks, their totals per project and day, and the entry form data. */
export async function getWeekData(
  userId: string,
  workspaceId: string,
  weekParam: string | string[] | undefined,
  timeZone: string,
) {
  const now = new Date();
  const week = resolveWeek(weekParam, timeZone, now);
  const range = weekRange(week, timeZone);

  const [form, entries] = await Promise.all([
    getEntryFormData(userId, workspaceId),
    prisma.timeEntry.findMany({
      where: { userId, project: { workspaceId }, startedAt: { gte: range.start, lt: range.end } },
      orderBy: { startedAt: "asc" },
      select: ENTRY_SELECT,
    }),
  ]);

  const projectsById = new Map(entries.map((entry) => [entry.projectId, entry.project]));

  return {
    ...form,
    week,
    range,
    today: zonedDateKey(now, timeZone),
    currentWeek: resolveWeek(undefined, timeZone, now),
    entries,
    buckets: bucketWeek(entries, range.days, timeZone, now),
    weekProjects: [...projectsById].map(([id, project]) => ({ id, ...project })),
  };
}

export type WeekData = Awaited<ReturnType<typeof getWeekData>>;
