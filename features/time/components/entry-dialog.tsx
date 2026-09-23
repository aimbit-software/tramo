"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, type FormEvent } from "react";

import { Autocomplete } from "@/components/common/autocomplete";
import { DateField } from "@/components/common/date-field";
import { Dropdown } from "@/components/common/dropdown";
import { Field, FIELD, FIELD_LABEL } from "@/components/common/field";
import { Modal } from "@/components/common/modal";
import { createEntryAction, updateEntryAction } from "@/features/time/entry-actions";
import { buildInterval } from "@/features/time/interval";
import { DESCRIPTION_MAX } from "@/features/time/schema";
import { focusFirstInvalid, type FieldErrors } from "@/lib/form";
import { zonedDateKey, zonedMinutesOfDay } from "@/lib/zoned";

export type EntryDialogProject = { id: string; name: string; color: string };

export type EditableEntry = {
  id: string;
  projectId: string;
  description: string;
  startedAt: string;
  endedAt: string;
};

type EntryDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Without an entry the dialog adds a new block. */
  entry?: EditableEntry;
  projects: EntryDialogProject[];
  suggestions: Record<string, string[]>;
  timeZone: string;
};

const hhmm = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

function initialValues(entry: EditableEntry | undefined, projects: EntryDialogProject[], timeZone: string) {
  if (!entry) {
    return {
      projectId: projects[0]?.id ?? "",
      description: "",
      date: zonedDateKey(new Date(), timeZone),
      start: "",
      end: "",
    };
  }
  const startedAt = new Date(entry.startedAt);
  const endedAt = new Date(entry.endedAt);
  return {
    projectId: entry.projectId,
    description: entry.description,
    date: zonedDateKey(startedAt, timeZone),
    start: hhmm(zonedMinutesOfDay(startedAt, timeZone)),
    end: hhmm(zonedMinutesOfDay(endedAt, timeZone)),
  };
}

/**
 * Add or fix a block by hand. The end field takes a time ("18:30") or a
 * duration ("1h30"); the line under it shows how it was understood before
 * saving. Every block saved here is flagged as manual or edited.
 */
export function EntryDialog(props: EntryDialogProps) {
  const t = useTranslations("entries");
  // The form remounts each time the dialog opens, so it always starts from
  // the entry's current values (or a fresh block).
  return (
    <Modal open={props.open} onClose={props.onClose} title={props.entry ? t("editTitle") : t("addTitle")}>
      {props.open && <EntryForm {...props} />}
    </Modal>
  );
}

function EntryForm({ onClose, entry, projects, suggestions, timeZone }: EntryDialogProps) {
  const t = useTranslations("entries");
  const [values, setValues] = useState(() => initialValues(entry, projects, timeZone));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  const set = (field: keyof typeof values) => (value: string) => setValues((current) => ({ ...current, [field]: value }));

  const preview =
    values.start.trim() && values.end.trim()
      ? buildInterval({ ...values, timeZone, now: new Date() })
      : null;

  function describeDuration(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) return t("durationMinutes", { minutes: rest });
    if (rest === 0) return t("durationHours", { hours });
    return t("durationHoursMinutes", { hours, minutes: rest });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const clientErrors: FieldErrors = {};
    if (!values.projectId) clientErrors.projectId = "projectRequired";
    const interval = buildInterval({ ...values, timeZone, now: new Date() });
    if (!interval.ok) Object.assign(clientErrors, interval.errors);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      focusFirstInvalid(form, clientErrors);
      return;
    }

    startTransition(async () => {
      const result = entry ? await updateEntryAction(entry.id, formData) : await createEntryAction(formData);
      if (result?.fieldErrors) {
        setErrors(result.fieldErrors);
        focusFirstInvalid(form, result.fieldErrors);
        return;
      }
      if (result?.error) {
        setErrors({ form: result.error });
        return;
      }
      onClose();
    });
  }

  const errorText = (key: string | undefined) => (key ? t(`errors.${key as "generic"}`) : undefined);
  const crossesMidnight = preview?.ok && zonedDateKey(preview.endedAt, timeZone) !== values.date;

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className={FIELD_LABEL}>{t("project")}</span>
        <Dropdown
          label={t("project")}
          name="projectId"
          value={values.projectId}
          onChange={set("projectId")}
          aria-invalid={errors.projectId ? true : undefined}
          options={projects.map((project) => ({
            value: project.id,
            label: project.name,
            icon: (
              <span
                aria-hidden
                className="size-2.5 flex-none rounded-full"
                style={{ backgroundColor: `var(--color-project-${project.color})` }}
              />
            ),
          }))}
        />
        {errors.projectId && (
          <p role="alert" className="text-xs text-warn">
            {errorText(errors.projectId)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className={FIELD_LABEL}>{t("description")}</span>
        <Autocomplete
          label={t("description")}
          name="description"
          value={values.description}
          onChange={set("description")}
          suggestions={suggestions[values.projectId] ?? []}
          placeholder={t("descriptionPlaceholder")}
          maxLength={DESCRIPTION_MAX}
          inputClassName={FIELD}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className={FIELD_LABEL}>{t("date")}</span>
        <DateField
          label={t("date")}
          name="date"
          value={values.date}
          onChange={set("date")}
          aria-invalid={errors.date ? true : undefined}
        />
        {errors.date && (
          <p role="alert" className="text-xs text-warn">
            {errorText(errors.date)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("start")} error={errorText(errors.start)} required>
          {(fieldProps) => (
            <input
              {...fieldProps}
              name="start"
              value={values.start}
              onChange={(event) => set("start")(event.target.value)}
              inputMode="numeric"
              autoComplete="off"
              placeholder={t("startPlaceholder")}
              className={`${FIELD} digits`}
            />
          )}
        </Field>
        <Field label={t("end")} error={errorText(errors.end)} required>
          {(fieldProps) => (
            <input
              {...fieldProps}
              name="end"
              value={values.end}
              onChange={(event) => set("end")(event.target.value)}
              autoComplete="off"
              placeholder={t("endPlaceholder")}
              className={`${FIELD} digits`}
            />
          )}
        </Field>
      </div>

      <p aria-live="polite" className="min-h-5 text-sm text-ink-muted">
        {preview?.ok &&
          `${t("lasts", { duration: describeDuration(preview.minutes) })}${crossesMidnight ? ` · ${t("nextDay")}` : ""}`}
      </p>

      {errors.form && (
        <p role="alert" className="rounded-tile bg-warn/10 px-4 py-3 text-sm text-warn">
          {errorText(errors.form)}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-tile px-4 py-2.5 font-display text-sm text-ink-muted transition-colors duration-150 ease-signature hover:bg-raised hover:text-ink motion-reduce:transition-none"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          aria-disabled={pending}
          className="rounded-tile bg-accent px-4 py-2.5 font-display text-sm font-medium text-on-accent transition-opacity duration-150 ease-signature hover:opacity-90 aria-disabled:cursor-wait aria-disabled:opacity-60 motion-reduce:transition-none"
        >
          {pending ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}
