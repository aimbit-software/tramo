import { FolderKanban } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { RefreshOnFocus } from "@/components/common/refresh-on-focus";
import { AppHeader } from "@/components/global/app-header";
import { RecentEntries } from "@/features/time/components/recent-entries";
import { TimerBar } from "@/features/time/components/timer-bar";
import { getTimerPageData } from "@/features/time/queries";
import { requireMember } from "@/lib/dal";

/** Home: the timer and the latest blocks. */
export default async function HomePage() {
  const { user, workspace, isAdmin } = await requireMember();
  const [t, data] = await Promise.all([getTranslations("timer"), getTimerPageData(user.id, workspace.id)]);

  return (
    <>
      <AppHeader userName={user.name} workspaceName={workspace.name} isAdmin={isAdmin} />
      <RefreshOnFocus />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
        <h1 className="sr-only">{t("title")}</h1>

        {data.projects.length === 0 && !data.running ? (
          <section className="panel-accent flex flex-col items-start gap-3 p-5">
            <span className="tile size-10" aria-hidden>
              <FolderKanban className="icon size-5 text-accent" />
            </span>
            <h2 className="font-display text-base font-medium">{t("noProjects.title")}</h2>
            <p className="text-sm text-ink-muted">{isAdmin ? t("noProjects.admin") : t("noProjects.member")}</p>
            {isAdmin && (
              <Link
                href="/admin/projects"
                className="rounded-tile bg-accent px-4 py-2.5 font-display text-sm font-medium text-on-accent transition-opacity duration-150 ease-signature hover:opacity-90 motion-reduce:transition-none"
              >
                {t("noProjects.adminCta")}
              </Link>
            )}
          </section>
        ) : (
          <TimerBar
            projects={data.projects}
            running={data.running}
            suggestions={data.suggestions}
            serverNow={data.serverNow}
          />
        )}

        <RecentEntries entries={data.recent} />
      </main>
    </>
  );
}
