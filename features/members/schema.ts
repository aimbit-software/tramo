import { z } from "zod";

// Shared by the invite form and its Server Action (see lib/form.ts). Messages
// are keys into messages/<locale>.json → members.errors.

export const WORKSPACE_ROLES = ["ADMIN", "MEMBER"] as const;

export const workspaceRoleSchema = z.enum(WORKSPACE_ROLES, { error: "invalidRole" });

export const inviteSchema = z.object({
  email: z
    .string({ error: "invalidEmail" })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "invalidEmail" })),
  role: workspaceRoleSchema,
});

export type InviteInput = z.infer<typeof inviteSchema>;

export function inviteFromForm(formData: FormData) {
  return { email: formData.get("email"), role: formData.get("role") };
}
