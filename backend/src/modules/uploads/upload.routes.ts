import { Router } from "express";
import multer from "multer";
import { UploadService } from "./upload.service";
import { PrismaConnectedAccountRepository } from "../connectedAccounts/connectedAccount.repository";
import { PrismaFileRepository } from "../files/file.repository";
import { mostFreeSpaceStrategy } from "../../strategies/accountPicker.strategy";
import { requireAuth, AuthedRequest } from "../../common/middleware/requireAuth";
import { asyncHandler } from "../../common/middleware/errorHandler";
import { Errors } from "../../common/errors/AppError";

const service = new UploadService(
  new PrismaConnectedAccountRepository(),
  new PrismaFileRepository(),
  mostFreeSpaceStrategy
);

// ponytail: memoryStorage buffers in RAM (never disk), which also lets us retry
// the same bytes against a second account on quota-exceeded. True zero-buffer
// streaming would drop that fallback ability — add only if large-file memory use bites.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

export const uploadRouter = Router();

uploadRouter.post(
  "/",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.user) throw Errors.unauthorized();
    if (!req.file) throw Errors.badRequest("No file uploaded (expected multipart field 'file')");

    const folderId = (req.body.folderId as string | undefined) || null;
    const file = await service.upload(req.user.id, folderId, req.file.originalname, req.file.mimetype, req.file.buffer);

    res.status(201).json({ ...file, sizeBytes: file.sizeBytes.toString() });
  })
);
