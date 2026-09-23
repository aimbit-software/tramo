import "server-only";

import { cookies } from "next/headers";

import { THEME_COOKIES, resolveTheme, type Theme } from "@/lib/theme";

/**
 * The visitor's stored theme, read on the server so <html> is rendered with
 * the right attributes and there is no flash on first paint.
 */
export async function getStoredTheme(): Promise<Theme> {
  const store = await cookies();

  return resolveTheme({
    palette: store.get(THEME_COOKIES.palette)?.value,
    mode: store.get(THEME_COOKIES.mode)?.value,
  });
}
