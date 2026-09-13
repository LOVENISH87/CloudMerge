import { Router } from "express";
import { FileController } from "./file.controller";
import { FileService } from "./file.service";
import { PrismaFileRepository } from "./file.repository";
import { PrismaConnectedAccountRepository } from "../connectedAccounts/connectedAccount.repository";
import { asyncHandler } from "../../common/middleware/errorHandler";
import { requireAuth } from "../../common/middleware/requireAuth";

const controller = new FileController(new FileService(new PrismaFileRepository(), new PrismaConnectedAccountRepository()));

export const fileRouter = Router();

fileRouter.get("/", requireAuth, asyncHandler(controller.list));
fileRouter.get("/:id", requireAuth, asyncHandler(controller.get));
fileRouter.patch("/:id", requireAuth, asyncHandler(controller.patch));
fileRouter.get("/:id/view-url", requireAuth, asyncHandler(controller.viewUrl));
fileRouter.get("/:id/download", requireAuth, asyncHandler(controller.download));
fileRouter.delete("/:id", requireAuth, asyncHandler(controller.delete));
