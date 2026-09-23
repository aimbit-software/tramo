import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { reconcileAccess } from "@/lib/access/onboarding";
import { prisma } from "@/lib/db";
import { parseEmailList } from "@/lib/email";

// BETTER_AUTH_SECRET and BETTER_AUTH_URL are read from the environment.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      prompt: "select_account",
    },
  },
  session: {
    // Sessions live in the database. This signed cookie saves one query per
    // request for 5 minutes; access decisions bypass it (see lib/dal.ts).
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  databaseHooks: {
    session: {
      create: {
        // Every sign-in reconciles workspace access: ADMIN_EMAILS, open
        // invitations and access requests (see lib/access/plan.ts). A failure
        // here must not block signing in: the person lands on the pending page,
        // which can retry.
        after: async (session) => {
          try {
            const user = await prisma.user.findUnique({
              where: { id: session.userId },
              select: { id: true, email: true },
            });
            if (user) {
              await reconcileAccess(prisma, user, parseEmailList(process.env.ADMIN_EMAILS));
            }
          } catch (error) {
            console.error("Access reconciliation failed on sign-in", error);
          }
        },
      },
    },
  },
  // Must stay last: it's what lets a Server Action set the session cookie.
  plugins: [nextCookies()],
});
