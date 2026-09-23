import { getFormatter, getTranslations } from "next-intl/server";

import { AddEntryButton, EntryRowActions } from "@/features/time/components/entry-buttons";
import type { TimerPageData } from "@/features/time/queries";
import { formatClock } from "@/lib/duration";

type RecentEntriesProps = {
  entries: TimerPageData["recent"];
  projects: TimerPageData["projects"];
  suggestions: TimerPageData["suggestions"];
  timeZone: string;
};

/** The person's latest finished blocks, newest first, each one editable. */
export async function RecentEntries({ entries, projects, suggestions, timeZone }: RecentEntriesProps) {
  const [t, format] = await Promise.all([getTranslations("timer.recent"), getFormatter()]);
  const shared = { projects, suggestions, timeZone };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xs tracking-widest text-ink-dim uppercase">{t("title")}</h2>
        <AddEntryButton {...shared} />
      </div>

      {entries.length === 0 ? (
        <p className="panel grain p-5 text-sm text-ink-muted">{t("empty")}</p>
      ) : (
        <ul className="panel grain flex flex-col">
          {entries.map((entry) => {
            const endedAt = entry.endedAt ?? entry.startedAt;
            const label = entry.description || entry.project.name;
            return (
              <li key={entry.id} className="flex items-center gap-3 py-2.5 pr-2 pl-4 not-first:hairline-t">
                <span
                  aria-hidden
                  className="size-2.5 flex-none rounded-full"
                  style={{ backgroundColor: `var(--color-project-${entry.project.color})` }}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm">
                    {entry.description || <span className="text-ink-dim">{t("noDescription")}</span>}
                  </span>
                  <span className="truncate text-xs text-ink-dim">
                    {entry.project.name} · {format.dateTime(entry.startedAt, { weekday: "short", day: "numeric", month: "short" })}{" "}
                    · {format.dateTime(entry.startedAt, { timeStyle: "short" })}–{format.dateTime(endedAt, { timeStyle: "short" })}
                    {entry.source === "MANUAL" || entry.editedAt ? ` · ${t("edited")}` : ""}
                  </span>
                </div>
                <span className="digits flex-none text-sm">{formatClock(endedAt.getTime() - entry.startedAt.getTime())}</span>
                <EntryRowActions
                  {...shared}
                  label={label}
                  entry={{
                    id: entry.id,
                    projectId: entry.projectId,
                    description: entry.description,
                    startedAt: entry.startedAt.toISOString(),
                    endedAt: endedAt.toISOString(),
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
