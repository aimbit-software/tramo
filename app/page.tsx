import { Pause } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ThemeSwitcher } from "@/features/theme/components/theme-switcher";
import { getStoredTheme } from "@/features/theme/queries";

/**
 * Temporary home: a live preview of the design system (timer row, tinted
 * panel, theme picker). Replaced by the real app shell in the next batch.
 */
export default async function HomePage() {
  const [t, theme] = await Promise.all([getTranslations("home"), getStoredTheme()]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12 sm:py-20">
      <header className="flex flex-col gap-2">
        <p className="font-display text-xs tracking-widest text-ink-dim">{t("eyebrow")}</p>
        <h1 className="font-display text-2xl font-medium">{t("title")}</h1>
        <p className="text-sm text-ink-muted">{t("notice")}</p>
      </header>

      <section className="panel grain flex items-center gap-4 p-4 sm:p-5">
        <span className="size-2 flex-none rounded-full bg-accent" aria-hidden />
        <div className="flex min-w-0 flex-col">
          <span className="digits text-2xl leading-tight">01:24:36</span>
          <span className="truncate text-sm text-ink-dim">
            {t("mockProject")} · {t("mockTask")}
          </span>
        </div>
        <button
          type="button"
          aria-label={t("pause")}
          className="ml-auto flex size-11 flex-none items-center justify-center rounded-full bg-accent text-on-accent transition-transform duration-150 ease-signature hover:scale-105 motion-reduce:transition-none"
        >
          <Pause className="icon size-5" aria-hidden />
        </button>
      </section>

      <section className="panel-accent flex items-center justify-between p-4 sm:p-5">
        <span className="text-sm text-ink-muted">{t("thisWeek")}</span>
        <span className="digits text-lg text-accent">{t("weekTotal")}</span>
      </section>

      <ThemeSwitcher initial={theme} />
    </main>
  );
}
