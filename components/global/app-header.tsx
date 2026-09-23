import { LogOut } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Avatar } from "@/components/common/avatar";
import { signOut } from "@/features/auth/actions";

type AppHeaderProps = {
  userName: string;
  workspaceName: string;
  /** Shows the admin entry. Navigation only: every admin page checks access itself. */
  isAdmin?: boolean;
};

const NAV_LINK =
  "rounded-pill px-3 py-1.5 text-sm text-ink-muted transition-colors duration-150 ease-signature hover:bg-raised hover:text-ink motion-reduce:transition-none";

export async function AppHeader({ userName, workspaceName, isAdmin = false }: AppHeaderProps) {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-3 z-10 mx-auto w-full max-w-5xl px-3">
      <div className="flex items-center gap-3 rounded-pill bg-surface/80 px-4 py-2 shadow-lg shadow-black/20 backdrop-blur">
        <Link href="/" className="font-display text-sm font-medium">
          {t("appName")}
        </Link>
        <span className="hidden truncate text-sm text-ink-dim sm:inline">{workspaceName}</span>

        <nav aria-label={t("label")} className="ml-auto flex items-center gap-1">
          {isAdmin && (
            <Link href="/admin/members" className={NAV_LINK}>
              {t("admin")}
            </Link>
          )}
          <Link href="/settings" className={NAV_LINK}>
            {t("settings")}
          </Link>
          <span className="ml-1">
            <Avatar name={userName} />
          </span>
          <form action={signOut}>
            <button
              type="submit"
              aria-label={t("signOut")}
              className="flex size-8 items-center justify-center rounded-full text-ink-muted transition-colors duration-150 ease-signature hover:bg-raised hover:text-ink motion-reduce:transition-none"
            >
              <LogOut className="icon size-4" aria-hidden />
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
