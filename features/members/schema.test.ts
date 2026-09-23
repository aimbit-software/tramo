import { describe, expect, it } from "vitest";

import { inviteFromForm, inviteSchema } from "@/features/members/schema";

describe("inviteSchema", () => {
  it("normalizes the email and accepts a workspace role", () => {
    const result = inviteSchema.safeParse({ email: "  Nuevo@Gmail.com ", role: "MEMBER" });
    expect(result.success && result.data).toEqual({ email: "nuevo@gmail.com", role: "MEMBER" });
  });

  it("rejects an invalid email with a message key", () => {
    const result = inviteSchema.safeParse({ email: "no-es-un-mail", role: "MEMBER" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("invalidEmail");
  });

  it("rejects roles outside the catalog", () => {
    const result = inviteSchema.safeParse({ email: "a@b.com", role: "OWNER" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("invalidRole");
  });
});

describe("inviteFromForm", () => {
  it("reads the fields a form posts", () => {
    const form = new FormData();
    form.set("email", "a@b.com");
    form.set("role", "ADMIN");
    expect(inviteFromForm(form)).toEqual({ email: "a@b.com", role: "ADMIN" });
  });
});
