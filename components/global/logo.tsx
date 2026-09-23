import { Hexagon, Hourglass } from "lucide-react";

import { HOURGLASS_SCALE } from "@/lib/brand-icon";

/**
 * Tramo's mark: Lucide's hourglass inside Lucide's hexagon, on a solid block
 * of the theme's accent, so it changes with the palette. The favicon draws
 * the same thing (lib/brand-icon.ts).
 *
 * The mark is a drawing, not a UI icon, so it sets its own stroke instead of
 * the `icon` class: the hourglass is drawn smaller, and its stroke grows by
 * the same factor to weigh the same as the hexagon's.
 */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <span aria-hidden className={`relative inline-flex flex-none items-center justify-center bg-accent text-on-accent ${className}`}>
      <Hexagon className="absolute size-[75%]" strokeWidth={2} />
      <Hourglass className="absolute size-[34.5%]" strokeWidth={2 / HOURGLASS_SCALE} />
    </span>
  );
}

/** The mark and the name, set in the poster face. */
export function Logo({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className={size === "lg" ? "size-14" : "size-9"} />
      <span className={`poster uppercase ${size === "lg" ? "text-6xl" : "text-3xl"}`}>{name}</span>
    </span>
  );
}
