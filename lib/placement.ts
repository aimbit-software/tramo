export type Box = { top: number; left: number; width: number; height: number };
export type Size = { width: number; height: number };

/**
 * Where a floating panel (a calendar, a list, a tour card) goes next to the
 * element that opened it, in viewport coordinates: below it, or above when it
 * doesn't fit below, left-aligned with it. It never leaves the viewport: when
 * it fits on neither side it's pinned inside, over the anchor.
 */
export function placeNextTo(anchor: Box, panel: Size, viewport: Size, gap = 8, margin = 8) {
  let top = anchor.top + anchor.height + gap;
  let side: "below" | "above" = "below";

  if (top + panel.height > viewport.height - margin) {
    const above = anchor.top - panel.height - gap;
    if (above >= margin) {
      top = above;
      side = "above";
    } else {
      top = Math.max(margin, viewport.height - panel.height - margin);
    }
  }

  const left = Math.max(margin, Math.min(anchor.left, viewport.width - panel.width - margin));
  return { top, left, side };
}
