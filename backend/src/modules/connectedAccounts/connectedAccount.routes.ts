import { Router } from "express";
import { ConnectedAccountController } from "./connectedAccount.controller";
import { ConnectedAccountService } from "./connectedAccount.service";
import { GoogleAuthProvider } from "./googleAuth.provider";
import { PrismaConnectedAccountRepository } from "./connectedAccount.repository";
import { AuthService } from "../auth/auth.service";
import { PrismaUserRepository } from "../auth/user.repository";
import { asyncHandler } from "../../common/middleware/errorHandler";
import { requireAuth } from "../../common/middleware/requireAuth";

const controller = new ConnectedAccountController(
  new ConnectedAccountService(
    new GoogleAuthProvider(),
    new PrismaConnectedAccountRepository(),
    new AuthService(new PrismaUserRepository())
  )
);

export const connectedAccountRouter = Router();

connectedAccountRouter.get("/google/login-url", asyncHandler(controller.getLoginUrl));
connectedAccountRouter.get("/google/connect-url", requireAuth, asyncHandler(controller.getConnectUrl));
connectedAccountRouter.get("/google/callback", asyncHandler(controller.callback));
connectedAccountRouter.get("/", requireAuth, asyncHandler(controller.list));
connectedAccountRouter.delete("/:id", requireAuth, asyncHandler(controller.delete));
connectedAccountRouter.post("/:id/sync-quota", requireAuth, asyncHandler(controller.syncQuota));
