import { RefreshOnFocus } from "@/components/common/refresh-on-focus";
import { AppHeader } from "@/components/global/app-header";
import { WeekView } from "@/features/time/components/week-view";
import { getWeekData } from "@/features/time/queries";
import { DEFAULT_TIME_ZONE } from "@/i18n/config";
import { requireMember } from "@/lib/dal";

export default async function WeekPage({ searchParams }: PageProps<"/week">) {
  const { user, workspace, isAdmin } = await requireMember();
  const { w } = await searchParams;
  const timeZone = user.timeZone ?? DEFAULT_TIME_ZONE;
  const data = await getWeekData(user.id, workspace.id, w, timeZone);

  return (
    <>
      <AppHeader userName={user.name} workspaceName={workspace.name} isAdmin={isAdmin} />
      <RefreshOnFocus />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
        <WeekView data={data} timeZone={timeZone} />
      </main>
    </>
  );
}
