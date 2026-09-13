import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().nullish(),
});
