import { CalendarRange, ChartColumnBig, House, LogOut, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Avatar } from "@/components/common/avatar";
import { AppNav, type NavLink } from "@/components/global/app-nav";
import { signOut } from "@/features/auth/actions";

type AppHeaderProps = {
  userName: string;
  workspaceName: string;
  /** Shows the admin entry. Navigation only: every admin page checks access itself. */
  isAdmin?: boolean;
  /** The help button, which belongs to the guide feature. */
  help?: ReactNode;
};

const ICON = "icon size-4";

/** The app chrome: links for this person, plus who's signed in and the way out. */
export async function AppHeader({ userName, workspaceName, isAdmin = false, help }: AppHeaderProps) {
  const t = await getTranslations("nav");

  const links: NavLink[] = [
    { href: "/", label: t("home"), icon: <House className={ICON} aria-hidden /> },
    { href: "/week", label: t("week"), icon: <CalendarRange className={ICON} aria-hidden /> },
    { href: "/metrics", label: t("metrics"), icon: <ChartColumnBig className={ICON} aria-hidden /> },
    ...(isAdmin
      ? [
          {
            href: "/admin/members" as const,
            label: t("admin"),
            icon: <ShieldCheck className={ICON} aria-hidden />,
            match: "/admin",
          },
        ]
      : []),
    { href: "/settings", label: t("settings"), icon: <SlidersHorizontal className={ICON} aria-hidden /> },
  ];

  return (
    <AppNav
      links={links}
      appName={t("appName")}
      workspaceName={workspaceName}
      actions={
        <>
          <span className="flex min-w-0 items-center gap-2">
            <Avatar name={userName} />
            <span className="truncate text-sm md:hidden">{userName}</span>
          </span>
          {help}
          <form action={signOut}>
            <button
              type="submit"
              aria-label={t("signOut")}
              className="flex size-10 items-center justify-center text-ink-muted transition-colors duration-150 ease-signature hover:bg-raised hover:text-ink motion-reduce:transition-none"
            >
              <LogOut className="icon size-4" aria-hidden />
            </button>
          </form>
        </>
      }
    />
  );
}
