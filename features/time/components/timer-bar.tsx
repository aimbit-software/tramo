"use client";

import { Pause, PictureInPicture2, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import { Autocomplete } from "@/components/common/autocomplete";
import { Dropdown } from "@/components/common/dropdown";
import { FIELD } from "@/components/common/field";
import { Modal } from "@/components/common/modal";
import { startTimerAction, stopTimerAction } from "@/features/time/actions";
import { useDocumentPip } from "@/features/time/components/use-document-pip";
import type { TimerPageData } from "@/features/time/queries";
import { DESCRIPTION_MAX } from "@/features/time/schema";
import { formatClock, isForgotten } from "@/lib/duration";

type Running = NonNullable<TimerPageData["running"]>;

type TimerBarProps = {
  projects: TimerPageData["projects"];
  running: TimerPageData["running"];
  suggestions: TimerPageData["suggestions"];
  serverNow: number;
};

function ProjectDot({ color, className = "size-2.5" }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex-none rounded-full ${className}`}
      style={{ backgroundColor: `var(--color-project-${color})` }}
    />
  );
}

const ROUND_BUTTON =
  "flex flex-none items-center justify-center rounded-full transition-[transform,opacity] duration-150 ease-signature hover:scale-105 aria-disabled:cursor-wait aria-disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:scale-100";

type PrimaryButtonProps = {
  size: "lg" | "sm";
  showsPause: boolean;
  label: string;
  disabled: boolean;
  onClick: () => void;
};

// Declared outside TimerBar on purpose: the clock re-renders every second, and
// a component defined inside render would remount each time, dropping focus.
function PrimaryButton({ size, showsPause, label, disabled, onClick }: PrimaryButtonProps) {
  const Icon = showsPause ? Pause : Play;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-disabled={disabled}
      aria-label={label}
      className={`${ROUND_BUTTON} bg-accent text-on-accent ${size === "lg" ? "size-12" : "size-10"}`}
    >
      <Icon className={`icon ${size === "lg" ? "size-5" : "size-4"}`} aria-hidden />
    </button>
  );
}

/**
 * The timer: project, task, a running clock and one button. The server owns
 * the truth (an entry with no end); this component only shows it, starting
 * the clock optimistically so the click feels instant.
 */
export function TimerBar({ projects, running, suggestions, serverNow }: TimerBarProps) {
  const t = useTranslations("timer");
  const [current, setCurrent] = useOptimistic<Running | null>(running);
  const [pending, startTransition] = useTransition();
  const [projectId, setProjectId] = useState(running?.projectId ?? projects[0]?.id ?? "");
  const [description, setDescription] = useState(running?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [forgottenDismissed, setForgottenDismissed] = useState(false);
  // `now` is the server's clock: the first render uses the server's value, then
  // each tick uses the client's clock corrected by the measured offset.
  const [now, setNow] = useState(serverNow);
  const offset = useRef(0);
  const originalTitle = useRef<string | null>(null);
  const pip = useDocumentPip();

  useEffect(() => {
    offset.current = serverNow - Date.now();
  }, [serverNow]);

  const elapsed = current ? now - new Date(current.startedAt).getTime() : 0;
  const clock = formatClock(elapsed);

  useEffect(() => {
    if (!current) return;
    const id = window.setInterval(() => setNow(Date.now() + offset.current), 1000);
    return () => window.clearInterval(id);
  }, [current]);

  // While running, the tab title is the clock: visible even with the tab in
  // the background, which covers browsers without the floating window.
  useEffect(() => {
    originalTitle.current ??= document.title;
    document.title = current ? `${clock} · ${current.projectName}` : originalTitle.current;
  }, [current, clock]);

  useEffect(
    () => () => {
      if (originalTitle.current) document.title = originalTitle.current;
    },
    [],
  );

  const selectedProject = projects.find((project) => project.id === projectId);
  const normalizedDescription = description.replace(/\s+/g, " ").trim();
  const isSameAsRunning =
    current !== null && current.projectId === projectId && current.description === normalizedDescription;

  function start() {
    if (!selectedProject || isSameAsRunning) return;
    setError(null);
    startTransition(async () => {
      setCurrent({
        projectId: selectedProject.id,
        description: normalizedDescription,
        startedAt: new Date(Date.now() + offset.current).toISOString(),
        projectName: selectedProject.name,
        projectColor: selectedProject.color,
      });
      setForgottenDismissed(false);
      const result = await startTimerAction(selectedProject.id, normalizedDescription);
      if (result?.error) setError(result.error);
    });
  }

  function stop() {
    setError(null);
    startTransition(async () => {
      setCurrent(null);
      const result = await stopTimerAction();
      if (result?.error) setError(result.error);
    });
  }

  const showsPause = current !== null && isSameAsRunning;
  const primaryLabel = showsPause ? t("stop") : current ? t("switch") : t("start");
  const onPrimary = showsPause ? stop : start;

  const forgotten =
    current !== null && !forgottenDismissed && isForgotten(new Date(current.startedAt), new Date(now));

  const primary = {
    showsPause,
    label: primaryLabel,
    disabled: pending || !selectedProject,
    onClick: onPrimary,
  };

  return (
    <section aria-label={t("title")} data-tour="timer" className="panel grain flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Dropdown
          label={t("project")}
          value={projectId}
          onChange={setProjectId}
          options={projects.map((project) => ({
            value: project.id,
            label: project.name,
            icon: <ProjectDot color={project.color} />,
          }))}
          className="sm:w-56"
        />
        <Autocomplete
          label={t("description")}
          value={description}
          onChange={setDescription}
          suggestions={suggestions[projectId] ?? []}
          placeholder={t("descriptionPlaceholder")}
          maxLength={DESCRIPTION_MAX}
          onSubmit={start}
          className="flex-1"
          inputClassName={FIELD}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex min-w-0 flex-col">
          <span role="timer" aria-label={t("elapsed")} className="digits text-3xl leading-tight sm:text-4xl">
            {clock}
          </span>
          <span className="flex min-w-0 items-center gap-2 text-sm text-ink-dim">
            {current ? (
              <>
                <ProjectDot color={current.projectColor} className="size-2" />
                <span className="truncate">
                  {current.projectName}
                  {current.description ? ` · ${current.description}` : ""}
                </span>
              </>
            ) : (
              t("idle")
            )}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {pip.supported && (
            <button
              type="button"
              data-tour="timer-pop-out"
              aria-label={pip.pipWindow ? t("closePopOut") : t("popOut")}
              aria-pressed={pip.pipWindow !== null}
              onClick={() => (pip.pipWindow ? pip.close() : pip.open({ width: 360, height: 128 }))}
              className="flex size-10 items-center justify-center rounded-full text-ink-muted transition-colors duration-150 ease-signature hover:bg-raised hover:text-ink aria-pressed:bg-raised aria-pressed:text-accent motion-reduce:transition-none"
            >
              <PictureInPicture2 className="icon size-5" aria-hidden />
            </button>
          )}
          <PrimaryButton size="lg" {...primary} />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-warn">
          {t(`errors.${error as "generic"}`)}
        </p>
      )}

      <Modal open={forgotten} onClose={() => setForgottenDismissed(true)} title={t("forgotten.title")}>
        <p className="text-sm text-ink-muted">
          {t("forgotten.body", {
            hours: Math.floor(elapsed / 3_600_000),
            project: current?.projectName ?? "",
          })}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => setForgottenDismissed(true)}
            className="rounded-tile px-4 py-2.5 font-display text-sm text-ink-muted transition-colors duration-150 ease-signature hover:bg-raised hover:text-ink motion-reduce:transition-none"
          >
            {t("forgotten.keep")}
          </button>
          <button
            type="button"
            onClick={() => {
              setForgottenDismissed(true);
              stop();
            }}
            className="rounded-tile bg-accent px-4 py-2.5 font-display text-sm font-medium text-on-accent transition-opacity duration-150 ease-signature hover:opacity-90 motion-reduce:transition-none"
          >
            {t("forgotten.stop")}
          </button>
        </div>
      </Modal>

      {pip.pipWindow &&
        createPortal(
          <div className="grain flex h-screen items-center gap-3 bg-ground px-4 text-ink">
            <div className="flex min-w-0 flex-1 flex-col">
              <span role="timer" aria-label={t("elapsed")} className="digits text-2xl leading-tight">
                {clock}
              </span>
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-ink-dim">
                {current ? (
                  <>
                    <ProjectDot color={current.projectColor} className="size-2" />
                    <span className="truncate">
                      {current.projectName}
                      {current.description ? ` · ${current.description}` : ""}
                    </span>
                  </>
                ) : (
                  <span className="truncate">{selectedProject?.name ?? t("idle")}</span>
                )}
              </span>
            </div>
            <PrimaryButton size="sm" {...primary} />
          </div>,
          pip.pipWindow.document.body,
        )}
    </section>
  );
}
