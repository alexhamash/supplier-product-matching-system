import type { Request, Response, NextFunction } from "express";

// ─── Custom AppError Class ──────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Not Found Handler ──────────────────────────────────────────────────────

/**
 * Catch-all handler for unmatched routes.
 * Must be registered **after** all route definitions.
 */
export const notFoundHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(new AppError("Resource not found", 404));
};

// ─── Global Error Handler ───────────────────────────────────────────────────

/**
 * Detect Prisma database errors (e.g. PrismaClientKnownRequestError,
 * PrismaClientValidationError) without importing the runtime classes, so the
 * handler stays dependency-light and works even if Prisma fails to load.
 */
const isPrismaError = (err: Error): boolean =>
  err.name.startsWith("PrismaClient") ||
  typeof (err as { code?: unknown }).code === "string";

/**
 * Central error-handling middleware.
 *
 * - Operational errors (AppError) → known status code + message.
 * - Unexpected errors → 500 Internal Server Error.
 *
 * In production, error stacks and internal database (Prisma) exception details
 * are sanitized before being returned to the client. Full details are always
 * logged server-side for debugging.
 */
export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const isProduction = process.env.NODE_ENV === "production";

  // Default to 500 for unexpected errors
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  // Always log the full error server-side for debugging.
  console.error(`[ERROR] ${statusCode} - ${err.message}`);
  if (!(err instanceof AppError)) {
    console.error(err.stack);
  }

  // Determine the client-facing message.
  let message: string;
  if (err instanceof AppError) {
    message = err.message;
  } else if (isPrismaError(err)) {
    // Never leak internal database exception details to clients.
    message = isProduction
      ? "A database error occurred."
      : err.message;
  } else {
    message = isProduction ? "An unexpected error occurred" : err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose the stack trace outside production.
    ...(!isProduction && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};
