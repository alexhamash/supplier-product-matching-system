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
 * Central error-handling middleware.
 *
 * - Operational errors (AppError) → known status code + message.
 * - Unexpected errors → 500 Internal Server Error (hides stack in production).
 */
export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Default to 500 for unexpected errors
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError
      ? err.message
      : "An unexpected error occurred";

  // Log the full error for debugging
  console.error(`[ERROR] ${statusCode} - ${err.message}`);
  if (!(err instanceof AppError)) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};
