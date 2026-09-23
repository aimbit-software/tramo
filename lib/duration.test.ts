import { describe, expect, it } from "vitest";

import { FORGOTTEN_AFTER_MS, formatClock, isForgotten } from "@/lib/duration";

const HOUR = 60 * 60 * 1000;

describe("formatClock", () => {
  it("formats as hh:mm:ss with zero padding", () => {
    expect(formatClock(0)).toBe("00:00:00");
    expect(formatClock((1 * 3600 + 23 * 60 + 45) * 1000)).toBe("01:23:45");
  });

  it("drops the milliseconds instead of rounding up", () => {
    expect(formatClock(59_999)).toBe("00:00:59");
  });

  it("keeps counting past a day", () => {
    expect(formatClock(100 * HOUR)).toBe("100:00:00");
  });

  it("never shows a negative time (clock skew)", () => {
    expect(formatClock(-5_000)).toBe("00:00:00");
  });
});

describe("isForgotten", () => {
  const start = new Date("2026-09-23T09:00:00Z");

  it("flags a timer running for 8 hours or more", () => {
    expect(FORGOTTEN_AFTER_MS).toBe(8 * HOUR);
    expect(isForgotten(start, new Date(start.getTime() + 8 * HOUR))).toBe(true);
  });

  it("leaves shorter sessions alone", () => {
    expect(isForgotten(start, new Date(start.getTime() + 8 * HOUR - 1))).toBe(false);
  });
});
