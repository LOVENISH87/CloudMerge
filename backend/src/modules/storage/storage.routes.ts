import { Router } from "express";
import { prisma } from "../../config/prisma";
import { requireAuth, AuthedRequest } from "../../common/middleware/requireAuth";
import { asyncHandler } from "../../common/middleware/errorHandler";
import { Errors } from "../../common/errors/AppError";

export const storageRouter = Router();

storageRouter.get(
  "/summary",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.user) throw Errors.unauthorized();

    const accounts = await prisma.connectedGoogleAccount.findMany({ where: { userId: req.user.id } });

    const totals = accounts.reduce(
      (acc, a) => {
        acc.totalBytes += a.quotaTotalBytes;
        acc.usedBytes += a.quotaUsedBytes;
        return acc;
      },
      { totalBytes: 0n, usedBytes: 0n }
    );

    res.json({
      accountCount: accounts.length,
      totalBytes: totals.totalBytes.toString(),
      usedBytes: totals.usedBytes.toString(),
      freeBytes: (totals.totalBytes - totals.usedBytes).toString(),
      accounts: accounts.map((a) => ({
        id: a.id,
        googleAccountEmail: a.googleAccountEmail,
        totalBytes: a.quotaTotalBytes.toString(),
        usedBytes: a.quotaUsedBytes.toString(),
        lastSyncedAt: a.lastSyncedAt,
      })),
    });
  })
);
