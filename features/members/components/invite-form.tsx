"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, type FormEvent } from "react";

import { Field, FIELD, FieldGroup } from "@/components/common/field";
import { RadioGroup } from "@/components/common/radio-group";
import { inviteMemberAction } from "@/features/members/actions";
import { inviteSchema, WORKSPACE_ROLES } from "@/features/members/schema";
import { focusFirstInvalid, toFieldErrors, type FieldErrors } from "@/lib/form";

type Role = (typeof WORKSPACE_ROLES)[number];

/**
 * Pre-approves a Google email. Submits by hand (onSubmit + transition) instead
 * of `<form action>`, so a rejected submission keeps what was typed.
 */
export function InviteForm() {
  const t = useTranslations("members");
  const [role, setRole] = useState<Role>("MEMBER");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [invited, setInvited] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setInvited(null);

    // Same schema as the action: instant feedback next to the field.
    const check = inviteSchema.safeParse({ email: formData.get("email"), role });
    if (!check.success) {
      const fieldErrors = toFieldErrors(check.error);
      setErrors(fieldErrors);
      focusFirstInvalid(form, fieldErrors);
      return;
    }

    startTransition(async () => {
      const result = await inviteMemberAction(formData);
      if (result?.fieldErrors) {
        setErrors(result.fieldErrors);
        focusFirstInvalid(form, result.fieldErrors);
        return;
      }
      setErrors({});
      setInvited(check.data.email);
      form.reset();
    });
  }

  const errorText = (key: string | undefined) =>
    key ? t(`errors.${key as "invalidEmail"}`) : undefined;

  return (
    <form noValidate onSubmit={submit} className="panel grain flex flex-col gap-5 p-5">
      <h2 className="font-display text-base font-medium">{t("invite.title")}</h2>

      <Field label={t("invite.email")} error={errorText(errors.email)} required hint={t("invite.hint")}>
        {(props) => (
          <input
            {...props}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="off"
            spellCheck={false}
            placeholder={t("invite.emailPlaceholder")}
            className={FIELD}
          />
        )}
      </Field>

      <FieldGroup label={t("invite.role")} error={errorText(errors.role)}>
        <input type="hidden" name="role" value={role} />
        <RadioGroup
          label={t("invite.role")}
          value={role}
          options={WORKSPACE_ROLES.map((value) => ({ value, label: t(`roles.${value}`) }))}
          onChange={setRole}
          className="inline-flex gap-1 rounded-tile bg-raised p-1"
          optionClassName={(checked) =>
            `rounded-[6px] px-3 py-1.5 text-sm transition-colors duration-150 ease-signature motion-reduce:transition-none ${
              checked ? "bg-tile text-ink" : "text-ink-muted hover:text-ink"
            }`
          }
          renderOption={(option) => option.label}
        />
      </FieldGroup>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          aria-disabled={pending}
          className="rounded-tile bg-accent px-4 py-2.5 font-display text-sm font-medium text-on-accent transition-opacity duration-150 ease-signature hover:opacity-90 aria-disabled:cursor-wait aria-disabled:opacity-60 motion-reduce:transition-none"
        >
          {pending ? t("invite.submitting") : t("invite.submit")}
        </button>
        {invited && (
          <p role="status" className="text-sm text-ink-muted">
            {t("invite.success", { email: invited })}
          </p>
        )}
      </div>
    </form>
  );
}
