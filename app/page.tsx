import { Timer } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AppHeader } from "@/components/global/app-header";
import { requireMember } from "@/lib/dal";

/**
 * Home for workspace members. The timer, weekly view and metrics land here in
 * the next batches.
 */
export default async function HomePage() {
  const { user, workspace, isAdmin } = await requireMember();
  const t = await getTranslations("home");
  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <>
      <AppHeader userName={user.name} workspaceName={workspace.name} isAdmin={isAdmin} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-1">
          <p className="font-display text-xs tracking-widest text-ink-dim uppercase">
            {isAdmin ? t("roleAdmin") : t("roleMember")}
          </p>
          <h1 className="font-display text-2xl font-medium">{t("greeting", { name: firstName })}</h1>
        </header>

        <section className="panel-accent flex items-center gap-4 p-5">
          <span className="tile size-10" aria-hidden>
            <Timer className="icon size-5 text-accent" />
          </span>
          <p className="text-sm text-ink-muted">{t("comingSoon")}</p>
        </section>
      </main>
    </>
  );
}
