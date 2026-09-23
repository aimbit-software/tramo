import { describe, expect, it } from "vitest";

import { METRIC_RANGES, resolveRange } from "@/features/metrics/range";

const AR = "America/Argentina/Buenos_Aires";
const now = new Date("2026-09-24T15:00:00Z"); // Thursday

describe("resolveRange", () => {
  it("offers three ranges", () => {
    expect(METRIC_RANGES).toEqual(["week", "4w", "12w"]);
  });

  it("covers the current week", () => {
    const range = resolveRange("week", AR, now);
    expect(range.key).toBe("week");
    expect(range.weeks).toEqual(["2026-09-21"]);
    expect(range.start.toISOString()).toBe("2026-09-21T03:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-09-28T03:00:00.000Z");
  });

  it("covers the current week and the ones before it", () => {
    const range = resolveRange("4w", AR, now);
    expect(range.weeks).toEqual(["2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21"]);
    expect(range.start.toISOString()).toBe("2026-08-31T03:00:00.000Z");
  });

  it("falls back to four weeks for anything unknown", () => {
    expect(resolveRange("forever", AR, now).key).toBe("4w");
    expect(resolveRange(undefined, AR, now).key).toBe("4w");
  });
});
