import { z } from "zod";

export const patchFileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  folderId: z.string().uuid().nullish(),
});
