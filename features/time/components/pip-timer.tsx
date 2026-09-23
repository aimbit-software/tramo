"use client";

import { Pause, Play, Square } from "lucide-react";
import type { ReactNode } from "react";

import { ClockTiles, type ClockState } from "@/features/time/components/clock-tiles";

type Action = { label: string; disabled: boolean; onClick: () => void };

type PipTimerProps = {
  ms: number;
  state: ClockState;
  clockLabel: string;
  units: { hours: string; minutes: string; seconds: string };
  /** What's running or paused, or what would start: project and task. */
  detail: ReactNode;
  /** Play or pause, by state. */
  primary: Action & { showsPause: boolean };
  /** Finishing the task; absent when there's none. */
  finish: Action | null;
};

/**
 * The floating window's content. The window can be any size the person drags
 * it to, so everything is sized from the window itself (vw, vh, vmin). It
 * stands upright by default, the clock above its buttons, and only lies down
 * in a row when the window is very flat (`flat`: short, or three times wider
 * than tall). Nothing ever overflows or scrolls.
 */
export function PipTimer({ ms, state, clockLabel, units, detail, primary, finish }: PipTimerProps) {
  const PrimaryIcon = primary.showsPause ? Pause : Play;

  return (
    <div className="grain flex h-dvh w-screen flex-col items-center justify-center gap-[5vmin] overflow-hidden bg-ground px-[6vmin] text-ink flat:flex-row">
      <div className="flex min-w-0 max-w-full flex-col items-center gap-[2.5vmin] flat:items-start">
        <ClockTiles
          ms={ms}
          state={state}
          label={clockLabel}
          units={units}
          className="text-[min(19vw,22vh)] flat:text-[min(12vw,50vh)]"
          unitClassName="[@media(max-height:130px)]:hidden"
        />
        <span className="flex min-w-0 max-w-full items-center gap-[0.5em] text-[clamp(10px,min(3.6vw,4.5vh),24px)] text-ink-dim [@media(max-height:160px)]:hidden">
          {detail}
        </span>
      </div>

      <div className="flex flex-none items-center gap-[3vmin]">
        <button
          type="button"
          onClick={primary.onClick}
          aria-disabled={primary.disabled}
          aria-label={primary.label}
          className="pressable flex size-[min(26vw,20vh)] flex-none items-center justify-center bg-accent text-on-accent aria-disabled:cursor-wait aria-disabled:opacity-60 flat:size-[min(18vw,55vh)]"
        >
          <PrimaryIcon className="icon size-[42%]" aria-hidden />
        </button>
        {finish && (
          <button
            type="button"
            onClick={finish.onClick}
            aria-disabled={finish.disabled}
            aria-label={finish.label}
            className="flex size-[min(17vw,13vh)] flex-none items-center justify-center border-2 border-edge text-ink transition-colors duration-150 ease-signature hover:bg-raised aria-disabled:cursor-wait aria-disabled:opacity-60 motion-reduce:transition-none flat:size-[min(12vw,36vh)]"
          >
            <Square className="icon size-[38%]" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
