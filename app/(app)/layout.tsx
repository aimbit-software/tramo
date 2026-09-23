import { Suspense, type ReactNode } from "react";

import { AppHeader } from "@/components/global/app-header";
import { NavigationProgress } from "@/components/global/navigation-progress";
import { isAdmin } from "@/lib/access/permissions";
import { getAccess } from "@/lib/dal";

/**
 * The signed-in app's chrome. The header lives here, not in each page, so it
 * stays mounted while pages change and every route's loading.tsx skeleton
 * shows right under it the moment a link is clicked.
 *
 * It only READS who is signed in, to draw the chrome. Layouts don't re-render
 * on client-side navigation, so they never guard anything: every page still
 * runs its own access check (requireMember / requireAdmin) and redirects.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const access = await getAccess();
  const member = access?.member;
  if (!access || !member) return children;

  return (
    <>
      {/* It reads the URL's search params, which want a Suspense boundary. */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <AppHeader userName={access.user.name} workspaceName={member.workspace.name} isAdmin={isAdmin(member)} />
      {children}
    </>
  );
}
