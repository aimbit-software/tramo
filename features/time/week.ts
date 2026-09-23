import { isIsoDate, zonedDateKey, zonedInstant, zonedWeekStart } from "@/lib/zoned";

type WeekEntry = { projectId: string; startedAt: Date; endedAt: Date | null };

export type WeekBuckets = {
  /** Minutes per project, one slot per day (Monday first). */
  byProject: Map<string, number[]>;
  dayTotals: number[];
  total: number;
};

/**
 * Adds a week of blocks into minutes per project and per day. A block counts
 * entirely on the day it started (owner's decision); a running one counts up
 * to `now`. Days are read in the person's own time zone.
 */
export function bucketWeek(entries: WeekEntry[], days: string[], timeZone: string, now: Date): WeekBuckets {
  const dayIndex = new Map(days.map((day, index) => [day, index]));
  const byProject = new Map<string, number[]>();
  const dayTotals = days.map(() => 0);
  let total = 0;

  for (const entry of entries) {
    const index = dayIndex.get(zonedDateKey(entry.startedAt, timeZone));
    if (index === undefined) continue;

    const end = entry.endedAt ?? now;
    const minutes = Math.max(0, (end.getTime() - entry.startedAt.getTime()) / 60_000);

    const row = byProject.get(entry.projectId) ?? days.map(() => 0);
    row[index] = (row[index] ?? 0) + minutes;
    byProject.set(entry.projectId, row);
    dayTotals[index] = (dayTotals[index] ?? 0) + minutes;
    total += minutes;
  }

  return { byProject, dayTotals, total };
}

/**
 * The week a `?w=` parameter asks for, as its Monday. Any valid day snaps to
 * its week; anything else (or nothing) means the current week.
 */
export function resolveWeek(param: string | string[] | undefined, timeZone: string, now: Date): string {
  if (typeof param === "string" && isIsoDate(param)) {
    return zonedWeekStart(zonedInstant(param, 12 * 60, timeZone), timeZone);
  }
  return zonedWeekStart(now, timeZone);
}
