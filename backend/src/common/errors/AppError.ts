export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const Errors = {
  badRequest: (msg: string) => new AppError(400, msg),
  unauthorized: (msg = "Unauthorized") => new AppError(401, msg),
  forbidden: (msg = "Forbidden") => new AppError(403, msg),
  notFound: (msg = "Not found") => new AppError(404, msg),
  conflict: (msg: string) => new AppError(409, msg),
};
