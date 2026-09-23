import { describe, expect, it } from "vitest";

import { placeNextTo } from "@/lib/placement";

const viewport = { width: 1000, height: 800 };
const panel = { width: 300, height: 200 };
const anchorAt = (top: number, left = 100) => ({ top, left, width: 150, height: 40 });

describe("placeNextTo", () => {
  it("opens below the anchor when it fits", () => {
    expect(placeNextTo(anchorAt(100), panel, viewport)).toEqual({ top: 148, left: 100, side: "below" });
  });

  it("flips above when there's no room below", () => {
    expect(placeNextTo(anchorAt(650), panel, viewport)).toEqual({ top: 442, left: 100, side: "above" });
  });

  it("stays inside the viewport when it fits neither below nor above", () => {
    const tall = { width: 300, height: 700 };
    expect(placeNextTo(anchorAt(300), tall, viewport)).toEqual({ top: 92, left: 100, side: "below" });
  });

  it("never leaves the viewport sideways", () => {
    expect(placeNextTo(anchorAt(100, 900), panel, viewport).left).toBe(692);
    expect(placeNextTo(anchorAt(100, -40), panel, viewport).left).toBe(8);
  });

  it("keeps the margin on a viewport narrower than the panel", () => {
    expect(placeNextTo(anchorAt(100, 50), panel, { width: 280, height: 800 }).left).toBe(8);
  });
});
