import { describe, expect, it } from "vitest";

import { toSearchKey } from "@/lib/search";

describe("toSearchKey", () => {
  it("folds accents, case and extra spaces", () => {
    expect(toSearchKey("  Diseño   de la LANDING ")).toBe("diseno de la landing");
    expect(toSearchKey("Reunión con el Índigo")).toBe("reunion con el indigo");
  });
});
