import { getTranslations } from "next-intl/server";

import { AdminNav } from "@/components/global/admin-nav";
import { AppHeader } from "@/components/global/app-header";
import { CreateProjectForm } from "@/features/projects/components/create-project-form";
import { ProjectsBoard } from "@/features/projects/components/projects-board";
import { getProjectsBoard } from "@/features/projects/queries";
import { requireAdmin } from "@/lib/dal";

export default async function ProjectsAdminPage() {
  const { user, workspace } = await requireAdmin();
  const [t, board] = await Promise.all([getTranslations("projects"), getProjectsBoard(workspace.id)]);

  return (
    <>
      <AppHeader userName={user.name} workspaceName={workspace.name} isAdmin />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
        <AdminNav current="projects" />
        <header className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-medium">{t("title")}</h1>
          <p className="text-sm text-ink-muted">{t("subtitle")}</p>
        </header>
        <CreateProjectForm />
        <ProjectsBoard projects={board.projects} people={board.people} />
      </main>
    </>
  );
}
