import { z } from "zod";

export const DESCRIPTION_MAX = 200;

/** What starting a timer needs. The description is free text, whitespace-normalized. */
export const startTimerSchema = z.object({
  projectId: z.string().min(1).max(64),
  description: z
    .string()
    .max(DESCRIPTION_MAX)
    .transform((value) => value.replace(/\s+/g, " ").trim()),
});
