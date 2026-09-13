import { Router } from "express";
import { FolderController } from "./folder.controller";
import { FolderService } from "./folder.service";
import { PrismaFolderRepository } from "./folder.repository";
import { asyncHandler } from "../../common/middleware/errorHandler";
import { requireAuth } from "../../common/middleware/requireAuth";

const controller = new FolderController(new FolderService(new PrismaFolderRepository()));

export const folderRouter = Router();

folderRouter.get("/recent", requireAuth, asyncHandler(controller.recent));
folderRouter.get("/", requireAuth, asyncHandler(controller.list));
folderRouter.post("/", requireAuth, asyncHandler(controller.create));
folderRouter.delete("/:id", requireAuth, asyncHandler(controller.delete));
