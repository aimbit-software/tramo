import type { ReactNode } from "react";
import { getFormatter, getTranslations } from "next-intl/server";

import { AdminNav } from "@/components/global/admin-nav";
import { AppHeader } from "@/components/global/app-header";
import { InviteForm } from "@/features/members/components/invite-form";
import {
  ActiveMemberActions,
  PendingActions,
  RestoreAction,
  RevokeInvitation,
} from "@/features/members/components/member-actions";
import { listMembers, listOpenInvitations } from "@/features/members/queries";
import { requireAdmin } from "@/lib/dal";

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xs tracking-widest text-ink-dim uppercase">
        {title} <span className="digits">({count})</span>
      </h2>
      <ul className="panel grain flex flex-col">{children}</ul>
    </section>
  );
}

function Row({ primary, secondary, actions }: { primary: ReactNode; secondary: ReactNode; actions: ReactNode }) {
  return (
    <li className="flex flex-col gap-3 px-4 py-3.5 not-first:hairline-t sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm">{primary}</span>
        <span className="truncate text-xs text-ink-dim">{secondary}</span>
      </div>
      {actions}
    </li>
  );
}

export default async function MembersPage() {
  const { user, workspace } = await requireAdmin();
  const [t, format, members, invitations] = await Promise.all([
    getTranslations("members"),
    getFormatter(),
    listMembers(workspace.id),
    listOpenInvitations(workspace.id),
  ]);

  const pending = members.filter((member) => member.status === "PENDING");
  const active = members.filter((member) => member.status === "ACTIVE");
  const rejected = members.filter((member) => member.status === "REJECTED");

  return (
    <>
      <AppHeader userName={user.name} workspaceName={workspace.name} isAdmin />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
        <AdminNav current="members" />
        <header className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-medium">{t("title")}</h1>
          <p className="text-sm text-ink-muted">{t("subtitle")}</p>
        </header>

        <InviteForm />

        {pending.length > 0 && (
          <Section title={t("pending.title")} count={pending.length}>
            {pending.map((member) => (
              <Row
                key={member.id}
                primary={member.user.name}
                secondary={`${member.user.email} · ${t("pending.requested", {
                  date: format.relativeTime(member.createdAt),
                })}`}
                actions={<PendingActions memberId={member.id} />}
              />
            ))}
          </Section>
        )}

        <Section title={t("active.title")} count={active.length}>
          {active.map((member) => (
            <Row
              key={member.id}
              primary={member.user.id === user.id ? `${member.user.name} · ${t("active.you")}` : member.user.name}
              secondary={member.user.email}
              actions={
                member.user.id === user.id ? (
                  <span className="rounded-pill bg-tile px-3 py-1 font-display text-xs">{t(`roles.${member.role}`)}</span>
                ) : (
                  <ActiveMemberActions memberId={member.id} name={member.user.name} role={member.role} />
                )
              }
            />
          ))}
        </Section>

        {invitations.length > 0 && (
          <Section title={t("invitations.title")} count={invitations.length}>
            {invitations.map((invitation) => (
              <Row
                key={invitation.id}
                primary={invitation.email}
                secondary={t("invitations.invitedAs", { role: t(`roles.${invitation.role}`) })}
                actions={<RevokeInvitation invitationId={invitation.id} email={invitation.email} />}
              />
            ))}
          </Section>
        )}

        {rejected.length > 0 && (
          <Section title={t("rejected.title")} count={rejected.length}>
            {rejected.map((member) => (
              <Row
                key={member.id}
                primary={member.user.name}
                secondary={member.user.email}
                actions={<RestoreAction memberId={member.id} />}
              />
            ))}
          </Section>
        )}
      </main>
    </>
  );
}
