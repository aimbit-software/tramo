/**
 * Theme catalog and resolution.
 *
 * A theme is a palette plus a mode. Both travel as attributes on <html>
 * (`data-palette`, `data-theme`) and are read by app/globals.css. The stored
 * choice arrives from cookies, which are user-controlled input, so every value
 * is validated here and falls back to the default on its own.
 */

export const PALETTES = ["salvia", "indigo", "lima", "ambar"] as const;
export const MODES = ["dark", "light"] as const;

export type Palette = (typeof PALETTES)[number];
export type Mode = (typeof MODES)[number];
export type Theme = { palette: Palette; mode: Mode };

export const DEFAULT_THEME: Theme = { palette: "salvia", mode: "dark" };

export const THEME_COOKIES = { palette: "palette", mode: "mode" } as const;

/** One year: the preference should outlive any session. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isPalette(value: unknown): value is Palette {
  return typeof value === "string" && (PALETTES as readonly string[]).includes(value);
}

export function isMode(value: unknown): value is Mode {
  return typeof value === "string" && (MODES as readonly string[]).includes(value);
}

export function resolveTheme(stored: { palette?: string; mode?: string }): Theme {
  return {
    palette: isPalette(stored.palette) ? stored.palette : DEFAULT_THEME.palette,
    mode: isMode(stored.mode) ? stored.mode : DEFAULT_THEME.mode,
  };
}
