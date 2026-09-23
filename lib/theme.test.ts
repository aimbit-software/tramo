import { describe, expect, it } from "vitest";

import {
  DEFAULT_THEME,
  MODES,
  PALETTES,
  isMode,
  isPalette,
  resolveTheme,
} from "@/lib/theme";

describe("theme catalog", () => {
  it("ships four palettes and two modes", () => {
    expect(PALETTES).toEqual(["salvia", "indigo", "lima", "ambar"]);
    expect(MODES).toEqual(["dark", "light"]);
  });

  it("defaults to salvia in dark mode", () => {
    expect(DEFAULT_THEME).toEqual({ palette: "salvia", mode: "dark" });
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
      palette: "salvia",
      mode: "light",
    });
  });
});
