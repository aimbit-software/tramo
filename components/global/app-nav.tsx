"use client";

import { Menu, X } from "lucide-react";
import type { Route } from "next";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, type PointerEvent, type ReactNode } from "react";

import { Logo } from "@/components/global/logo";

export type NavLink = {
  href: Route;
  label: string;
  /** A Lucide icon, rendered on the server and passed down as an element. */
  icon: ReactNode;
  /** Path prefix of the section's subpages, so they light the link up too. */
  match?: string;
};

// Swipe to close: the drag starts after these pixels (so a tap stays a tap),
// and the sheet closes past this share of its height or above this speed (px/ms).
const DRAG_START = 8;
const CLOSE_SHARE = 0.3;
const CLOSE_SPEED = 0.5;

/**
 * A desktop link's bar: a solid accent block on the header's bottom edge for
 * the current page, pulsing on the link being opened until its page arrives.
 */
function NavLinkBar({ active }: { active: boolean }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`absolute inset-x-0 -bottom-px h-1 bg-accent transition-opacity motion-reduce:transition-none ${
        pending ? "animate-pulse opacity-100 motion-reduce:animate-none" : active ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

type AppNavProps = {
  links: NavLink[];
  appName: string;
  workspaceName: string;
  /** The user block (avatar, help, sign out): at the bar's end on desktop, at the sheet's foot on mobile. */
  actions: ReactNode;
};

/**
 * The app's navigation: a full-width bar drawn with a rule, the logo in the
 * theme's accent, and the sections in mono capitals, each with its icon.
 *
 * Mobile: the links move to a bottom sheet, within thumb reach. It's a native
 * <dialog>, so focus trapping, Escape and an inert page come free. It closes
 * with the X, by tapping the backdrop, or by swiping down.
 */
export function AppNav({ links, appName, workspaceName, actions }: AppNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const sheetRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startTime: number; offset: number; moved: boolean } | null>(null);

  const isActive = (link: NavLink) =>
    pathname === link.href || (link.match !== undefined && pathname.startsWith(link.match));

  const closeSheet = () => sheetRef.current?.close();

  function openSheet() {
    // Closing by swipe leaves the panel at the drag offset so it keeps sliding
    // out; clear it before showing the sheet again.
    resetDrag();
    sheetRef.current?.showModal();
    // Focus the panel itself: focusing the X would paint a focus ring on every
    // tap-open. Keyboard users reach the X with Tab.
    panelRef.current?.focus({ preventScroll: true });
  }

  // While dragging, styles are written straight onto the panel, so a finger
  // moving at 120 Hz doesn't re-render React every frame.
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { startY: event.clientY, startTime: event.timeStamp, offset: 0, moved: false };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    const panel = panelRef.current;
    if (!state || !panel) return;

    // Down only: the sheet can't be pulled above its resting place.
    const offset = Math.max(0, event.clientY - state.startY);
    if (!state.moved) {
      if (offset < DRAG_START) return;
      state.moved = true;
      // Capturing also redirects the final click to the panel, so a drag that
      // started on a link doesn't follow it.
      try {
        panel.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic pointers can't be captured; the drag still works.
      }
    }

    state.offset = offset;
    panel.style.transition = "none";
    panel.style.translate = `0 ${offset}px`;
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    const panel = panelRef.current;
    drag.current = null;
    if (!state?.moved || !panel) return;

    const speed = state.offset / Math.max(1, event.timeStamp - state.startTime);
    panel.style.transition = "";
    if (state.offset > panel.offsetHeight * CLOSE_SHARE || speed > CLOSE_SPEED) {
      closeSheet(); // keeps the offset while it slides out; openSheet resets it
    } else {
      panel.style.translate = ""; // not far or fast enough: back into place
    }
  }

  function resetDrag() {
    drag.current = null;
    panelRef.current?.style.removeProperty("transition");
    panelRef.current?.style.removeProperty("translate");
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-rule bg-ground/95 backdrop-blur-sm">
      <nav aria-label={t("label")} className="mx-auto flex h-16 w-full max-w-5xl items-center gap-4 px-4">
        <Link href="/" aria-label={t("home")} className="flex-none">
          <Logo name={appName} />
        </Link>
        <span className="hidden max-w-36 truncate border-l border-rule pl-4 font-display text-xs tracking-widest text-ink-dim uppercase lg:inline">
          {workspaceName}
        </span>

        <ul className="ml-2 hidden h-full items-stretch md:flex">
          {links.map((link) => {
            const active = isActive(link);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-full items-center gap-2 px-3 font-display text-xs tracking-widest uppercase transition-colors duration-150 ease-signature hover:bg-raised hover:text-ink motion-reduce:transition-none ${
                    active ? "text-ink" : "text-ink-muted"
                  }`}
                >
                  {link.icon}
                  {link.label}
                  <NavLinkBar active={active} />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto hidden items-center gap-1 md:flex">{actions}</div>

        <button
          type="button"
          data-tour="nav-menu"
          onClick={openSheet}
          aria-label={t("openMenu")}
          aria-haspopup="dialog"
          className="ml-auto inline-flex size-10 items-center justify-center border border-rule text-ink transition-colors duration-150 ease-signature hover:bg-raised motion-reduce:transition-none md:hidden"
        >
          <Menu className="icon size-5" aria-hidden />
        </button>
      </nav>

      <dialog
        ref={sheetRef}
        aria-label={t("menu")}
        // A click on the dialog element itself is a click on the backdrop.
        onClick={(event) => {
          if (event.target === event.currentTarget) closeSheet();
        }}
        className="mt-auto mb-0 w-full max-w-none translate-y-full bg-transparent p-0 text-ink transition-[translate,display,overlay] transition-discrete duration-300 ease-signature backdrop:bg-ground/70 open:translate-y-0 starting:open:translate-y-full motion-reduce:transition-none md:hidden"
      >
        <div
          ref={panelRef}
          tabIndex={-1}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={resetDrag}
          // touch-none hands us vertical drags instead of the browser's scroll
          // and pull-to-refresh.
          className="panel grain touch-none border-x-0 border-b-0 px-6 pt-3 pb-[max(2rem,env(safe-area-inset-bottom))] outline-none transition-[translate] duration-300 ease-signature motion-reduce:transition-none"
        >
          <div aria-hidden className="mx-auto h-1 w-10 bg-ink/20" />
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="truncate font-display text-xs tracking-widest text-ink-dim uppercase">{workspaceName}</span>
            <button
              type="button"
              onClick={closeSheet}
              aria-label={t("closeMenu")}
              className="inline-flex size-10 flex-none items-center justify-center border border-rule text-ink transition-colors duration-150 ease-signature hover:bg-raised motion-reduce:transition-none"
            >
              <X className="icon size-5" aria-hidden />
            </button>
          </div>

          <ul className="mt-2">
            {links.map((link, index) => {
              const active = isActive(link);
              return (
                <li
                  key={link.href}
                  // The links rise one after another as the sheet opens.
                  style={{ transitionDelay: `${80 + index * 40}ms` }}
                  className="transition-[opacity,translate] duration-300 not-first:hairline-t starting:translate-y-3 starting:opacity-0 motion-reduce:transition-none"
                >
                  <Link
                    href={link.href}
                    onClick={closeSheet}
                    aria-current={active ? "page" : undefined}
                    className={`poster flex items-center gap-3 py-3 text-4xl uppercase transition-colors duration-150 ease-signature hover:text-ink motion-reduce:transition-none ${
                      active ? "text-ink" : "text-ink-muted"
                    }`}
                  >
                    {link.label}
                    {active && <span aria-hidden className="ml-auto h-3 w-8 bg-accent" />}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hairline-t mt-6 flex items-center justify-between gap-3 pt-6">{actions}</div>
        </div>
      </dialog>
    </header>
  );
}
