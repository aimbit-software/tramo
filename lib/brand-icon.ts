/**
 * Tramo's mark as a standalone SVG, for places React doesn't render: the
 * favicon and the home-screen icon. It's the same drawing as the header's
 * logo (components/global/logo.tsx): Lucide's hexagon with Lucide's
 * hourglass inside (paths from Lucide, ISC license), on a square block.
 */

/** How big the hourglass is next to the hexagon (both drawn on Lucide's 24-unit grid). */
export const HOURGLASS_SCALE = 0.46;

const HEXAGON = "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z";
const HOURGLASS = [
  "M5 22h14",
  "M5 2h14",
  "M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22",
  "M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2",
];

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function brandIconSvg({ background, foreground }: { background: string; foreground: string }): string {
  if (!HEX_COLOR.test(background) || !HEX_COLOR.test(foreground)) {
    throw new Error("brandIconSvg takes #rrggbb colors only");
  }
  // The hourglass is drawn smaller, so its stroke is thickened by the same
  // factor: both lines end up equally heavy, like in the header.
  const offset = (24 * (1 - HOURGLASS_SCALE)) / 2;
  const line = `fill="none" stroke="${foreground}" stroke-linecap="round" stroke-linejoin="round"`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">`,
    `<rect width="32" height="32" fill="${background}"/>`,
    `<g transform="translate(4 4)">`,
    `<path d="${HEXAGON}" ${line} stroke-width="2"/>`,
    `<g transform="translate(${offset.toFixed(2)} ${offset.toFixed(2)}) scale(${HOURGLASS_SCALE})" ${line} stroke-width="${(2 / HOURGLASS_SCALE).toFixed(2)}">`,
    ...HOURGLASS.map((d) => `<path d="${d}"/>`),
    `</g>`,
    `</g>`,
    `</svg>`,
  ].join("");
}
