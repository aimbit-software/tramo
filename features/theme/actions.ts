"use server";

import { cookies } from "next/headers";

import { THEME_COOKIES, THEME_COOKIE_MAX_AGE, isMode, isPalette } from "@/lib/theme";

/**
 * Stores the theme choice in cookies. The arguments come from the client, so
 * anything outside the catalog is ignored rather than written.
 *
 * Persisting the choice to the user's account comes with authentication; the
 * cookie stays as the server-side mirror that renders <html> without a flash.
 */
export async function saveTheme(palette: string, mode: string): Promise<void> {
  if (!isPalette(palette) || !isMode(mode)) return;

  const store = await cookies();
  const options = {
    path: "/",
    maxAge: THEME_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  } as const;

  store.set(THEME_COOKIES.palette, palette, options);
  store.set(THEME_COOKIES.mode, mode, options);
}
