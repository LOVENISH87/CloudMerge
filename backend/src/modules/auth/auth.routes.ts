import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaUserRepository } from "./user.repository";
import { asyncHandler } from "../../common/middleware/errorHandler";
import { requireAuth } from "../../common/middleware/requireAuth";

const controller = new AuthController(new AuthService(new PrismaUserRepository()));

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, try again shortly" },
});

export const authRouter = Router();

authRouter.post("/register", asyncHandler(controller.register));
authRouter.post("/login", loginLimiter, asyncHandler(controller.login));
authRouter.post("/refresh", asyncHandler(controller.refresh));
authRouter.post("/logout", requireAuth, asyncHandler(controller.logout));
authRouter.get("/me", requireAuth, asyncHandler(controller.me));
