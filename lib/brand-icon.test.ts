import { describe, expect, it } from "vitest";

import { brandIconSvg, HOURGLASS_SCALE } from "@/lib/brand-icon";

describe("brandIconSvg", () => {
  const svg = brandIconSvg({ background: "#c5ef5a", foreground: "#171a0c" });

  it("is a square SVG block in the theme's accent", () => {
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 32 32">/);
    expect(svg).toContain('<rect width="32" height="32" fill="#c5ef5a"/>');
  });

  it("draws the hexagon and the hourglass in the color that reads on it", () => {
    expect(svg).toContain('stroke="#171a0c"');
    expect(svg).toContain("M21 16V8a2 2 0 0 0-1-1.73l-7-4"); // Lucide's hexagon
    expect(svg).toContain("M17 22v-4.172"); // Lucide's hourglass
  });

  it("keeps the hourglass's line as thick as the hexagon's, though it's drawn smaller", () => {
    expect(svg).toContain(`stroke-width="${(2 / HOURGLASS_SCALE).toFixed(2)}"`);
  });

  it("only accepts hex colors, so nothing else ends up in the markup", () => {
    expect(() => brandIconSvg({ background: "red\"/><script>", foreground: "#000" })).toThrow();
  });
});
