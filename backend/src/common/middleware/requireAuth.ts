import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { Errors } from "../errors/AppError";

export interface AuthedRequest extends Request {
  user?: { id: string; email: string };
}

// route params are always plain strings for our routes (":id"); Express's type allows string[] for repeated segments we don't use
export function paramId(req: Request): string {
  return req.params.id as string;
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return next(Errors.unauthorized());

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(Errors.unauthorized("Invalid or expired token"));
  }
}
