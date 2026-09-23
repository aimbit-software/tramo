import "server-only";

import { Prisma, type PrismaClient } from "@/generated/prisma/client";

/**
 * The timer's rules, against the database. The server is the source of truth:
 * a running timer is just an entry without `endedAt`, so closing the tab or
 * the floating window never stops or loses time, and any device sees it.
 *
 * Pausing is stopping (it closes the entry); resuming starts a new entry with
 * the same project and description, so every row is one editable block.
 */

export type TimerResult = { ok: true } | { ok: false; reason: "cannotTrack" | "conflict" };

type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Closes whatever is running at `now`. A block that would end at or before its
 * own start (two clicks in the same millisecond) is dropped instead, since the
 * database refuses an entry that doesn't end after it starts.
 */
async function closeRunning(tx: Tx, userId: string, now: Date) {
  const current = await tx.timeEntry.findFirst({ where: { userId, endedAt: null } });
  if (!current) return null;

  if (now.getTime() > current.startedAt.getTime()) {
    await tx.timeEntry.update({ where: { id: current.id }, data: { endedAt: now } });
  } else {
    await tx.timeEntry.delete({ where: { id: current.id } });
  }
  return current;
}

export async function startTimer(
  db: PrismaClient,
  input: { userId: string; workspaceId: string; projectId: string; description: string; now: Date },
): Promise<TimerResult> {
  // Only trackers of a live project in this workspace can log time on it.
  const membership = await db.projectMember.findFirst({
    where: {
      userId: input.userId,
      projectId: input.projectId,
      role: "TRACKER",
      project: { workspaceId: input.workspaceId, archivedAt: null },
    },
    select: { projectId: true },
  });
  if (!membership) return { ok: false, reason: "cannotTrack" };

  try {
    await db.$transaction(async (tx) => {
      const current = await tx.timeEntry.findFirst({ where: { userId: input.userId, endedAt: null } });
      if (current && current.projectId === input.projectId && current.description === input.description) {
        return; // Already running exactly this: a double click, not a new block.
      }

      await closeRunning(tx, input.userId, input.now);
      await tx.timeEntry.create({
        data: {
          userId: input.userId,
          projectId: input.projectId,
          description: input.description,
          startedAt: input.now,
        },
      });
    });
    return { ok: true };
  } catch (error) {
    // Two devices started a timer at the same instant: the partial unique
    // index let only one through. The caller refreshes and shows the winner.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, reason: "conflict" };
    }
    throw error;
  }
}

export async function stopTimer(db: PrismaClient, input: { userId: string; now: Date }): Promise<TimerResult> {
  await db.$transaction((tx) => closeRunning(tx, input.userId, input.now));
  return { ok: true };
}

/**
 * The person's past task descriptions per project, most recently used first,
 * for the autocomplete. Loaded with the page and filtered on the client, so
 * typing costs no requests.
 */
export async function recentDescriptions(
  db: PrismaClient,
  userId: string,
  projectIds: string[],
  perProject = 30,
): Promise<Record<string, string[]>> {
  if (projectIds.length === 0) return {};

  const rows = await db.timeEntry.groupBy({
    by: ["projectId", "description"],
    where: { userId, projectId: { in: projectIds }, description: { not: "" } },
    _max: { startedAt: true },
    orderBy: { _max: { startedAt: "desc" } },
  });

  const byProject: Record<string, string[]> = {};
  for (const row of rows) {
    const list = (byProject[row.projectId] ??= []);
    if (list.length < perProject) list.push(row.description);
  }
  return byProject;
}
