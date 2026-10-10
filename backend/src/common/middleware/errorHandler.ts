import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.issues });
  }
  console.error("Unhandled Exception:", err);
  
  // In a real app we'd hide the raw message, but for this MVP/demo we need to surface the exact Google API error to the frontend!
  const msg = err instanceof Error ? err.message : "Internal server error";
  return res.status(500).json({ error: `Server error: ${msg}` });
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
