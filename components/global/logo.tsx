import { Hourglass } from "lucide-react";

import { HOURGLASS_BOX, HOURGLASS_STROKE } from "@/lib/brand-icon";

/**
 * Tramo's mark: Lucide's hourglass inside a hexagon of the theme's accent,
 * so it changes with the palette. The hexagon is Fragua's badge (the
 * `logo-badge` utility), so both marks read as one family. The favicon draws
 * the same thing (lib/brand-icon.ts): change one, change the other.
 *
 * The hourglass takes the color that reads on the accent (`on-accent`): white
 * would all but vanish on a light accent like Lima's. It's a drawing, not a UI
 * icon, so it sets its own, heavier stroke instead of the `icon` class.
 */
export function LogoMark({ className = "h-10" }: { className?: string }) {
  return (
    <span aria-hidden className={`logo-badge flex-none text-accent ${className}`}>
      <Hourglass
        className="aspect-square w-auto text-on-accent"
        style={{ height: `${HOURGLASS_BOX * 100}%` }}
        strokeWidth={HOURGLASS_STROKE}
      />
    </span>
  );
}

/** The mark and the name, set in the poster face. */
export function Logo({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className={size === "lg" ? "h-16" : "h-10"} />
      <span className={`poster uppercase ${size === "lg" ? "text-6xl" : "text-3xl"}`}>{name}</span>
    </span>
  );
}
