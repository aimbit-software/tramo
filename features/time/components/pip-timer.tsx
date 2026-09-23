"use client";

import { Pause, Play } from "lucide-react";
import type { ReactNode } from "react";

type PipTimerProps = {
  clock: string;
  /** Accessible name of the clock ("Tiempo transcurrido"). */
  clockLabel: string;
  /** What's running, or what would start: project and task. */
  detail: ReactNode;
  button: { showsPause: boolean; label: string; disabled: boolean; onClick: () => void };
};

/**
 * The floating window's content. The window can be any size the person drags
 * it to, so everything is sized from the window itself (vw, vh, vmin): the
 * clock and the button grow and shrink with it, a wide window lays them out
 * in a row and a tall one in a column, and the project line steps aside when
 * there's no height left for it. Nothing ever overflows or scrolls.
 */
export function PipTimer({ clock, clockLabel, detail, button }: PipTimerProps) {
  const Icon = button.showsPause ? Pause : Play;

  return (
    <div className="grain flex h-dvh w-screen items-center justify-center gap-[5vmin] overflow-hidden bg-ground px-[6vmin] text-ink portrait:flex-col portrait:gap-[5vmin]">
      <div className="flex min-w-0 max-w-full flex-col portrait:items-center">
        <span
          role="timer"
          aria-label={clockLabel}
          className="digits text-[min(11.5vw,40vh)] leading-none portrait:text-[min(16vw,16vh)]"
        >
          {clock}
        </span>
        <span className="mt-[1.5vmin] flex min-w-0 max-w-full items-center gap-[0.5em] text-[clamp(10px,min(3.4vw,9vh),26px)] text-ink-dim [@media(max-height:110px)]:hidden">
          {detail}
        </span>
      </div>
      <button
        type="button"
        onClick={button.onClick}
        aria-disabled={button.disabled}
        aria-label={button.label}
        className="flex size-[min(22vw,60vh)] flex-none items-center justify-center rounded-full bg-accent text-on-accent transition-[transform,opacity] duration-150 ease-signature hover:scale-105 aria-disabled:cursor-wait aria-disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:scale-100 portrait:size-[min(38vw,28vh)]"
      >
        <Icon className="icon size-[40%]" aria-hidden />
      </button>
    </div>
  );
}
