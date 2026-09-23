import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  brandIconHref,
  DEFAULT_THEME,
  MODES,
  PALETTES,
  isMode,
  isPalette,
  resolveTheme,
  THEME_ACCENTS,
} from "@/lib/theme";

describe("theme catalog", () => {
  it("ships four palettes and two modes", () => {
    expect(PALETTES).toEqual(["salvia", "indigo", "lima", "ambar"]);
    expect(MODES).toEqual(["dark", "light"]);
  });

  it("defaults to lima in dark mode", () => {
    expect(DEFAULT_THEME).toEqual({ palette: "lima", mode: "dark" });
  });
});

describe("isPalette / isMode", () => {
  it("accepts only known values", () => {
    expect(isPalette("lima")).toBe(true);
    expect(isPalette("ember")).toBe(false);
    expect(isMode("light")).toBe(true);
    expect(isMode("sepia")).toBe(false);
  });

  it("is strict about casing and whitespace", () => {
    expect(isPalette("Salvia")).toBe(false);
    expect(isPalette(" salvia")).toBe(false);
    expect(isMode("DARK")).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isPalette(undefined)).toBe(false);
    expect(isMode(null)).toBe(false);
  });
});

describe("resolveTheme with an account preference", () => {
  it("prefers this browser's cookie, field by field", () => {
    expect(
      resolveTheme({ palette: "lima" }, { palette: "indigo", mode: "light" }),
    ).toEqual({ palette: "lima", mode: "light" });
  });

  it("uses the account preference on a device without cookies", () => {
    expect(resolveTheme({}, { palette: "ambar", mode: "light" })).toEqual({ palette: "ambar", mode: "light" });
  });

  it("ignores invalid account values too", () => {
    expect(resolveTheme({}, { palette: "neon", mode: null })).toEqual(DEFAULT_THEME);
  });
});

describe("resolveTheme", () => {
  it("falls back to the default when nothing is stored", () => {
    expect(resolveTheme({})).toEqual(DEFAULT_THEME);
  });

  it("keeps valid stored values", () => {
    expect(resolveTheme({ palette: "indigo", mode: "light" })).toEqual({
      palette: "indigo",
      mode: "light",
    });
  });

  it("replaces each invalid value on its own", () => {
    expect(resolveTheme({ palette: "ambar", mode: "neon" })).toEqual({
      palette: "ambar",
      mode: "dark",
    });
    expect(resolveTheme({ palette: "<script>", mode: "light" })).toEqual({
      palette: "lima",
      mode: "light",
    });
  });
});

describe("THEME_ACCENTS", () => {
  // The favicon is drawn outside CSS, so it carries its own copy of the accent
  // pairs. This keeps that copy honest against app/globals.css.
  const css = readFileSync(path.resolve(process.cwd(), "app/globals.css"), "utf8");

  it("matches every palette and mode in globals.css", () => {
    for (const palette of PALETTES) {
      for (const mode of MODES) {
        const start = css.indexOf(`[data-palette="${palette}"][data-theme="${mode}"] {`);
        const block = start === -1 ? "" : css.slice(start, css.indexOf("}", start));
        const token = (name: string) => block.match(new RegExp(`--color-${name}: (#[0-9a-f]{6});`, "i"))?.[1];
        expect(THEME_ACCENTS[palette][mode], `${palette}-${mode}`).toEqual({
          accent: token("accent"),
          onAccent: token("on-accent"),
        });
      }
    }
  });
});

describe("brandIconHref", () => {
  it("points at the favicon drawn for the theme", () => {
    expect(brandIconHref({ palette: "lima", mode: "dark" })).toBe("/brand-icon/lima-dark");
  });
});
