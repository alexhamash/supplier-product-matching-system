import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";

// ─── JWT Payload Shape ──────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
}

// ─── Augment Express Request ────────────────────────────────────────────────
// Adds `req.user` so downstream handlers can access the authenticated user.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ─── JWT Secret ─────────────────────────────────────────────────────────────

const JWT_SECRET: string = process.env.JWT_SECRET || "dev-secret-change-me";

// ─── Auth Middleware ────────────────────────────────────────────────────────

/**
 * Verifies the `Authorization: Bearer <token>` header on protected routes.
 *
 * On success, attaches the decoded payload to `req.user` and calls `next()`.
 * On failure, responds with a 401 Unauthorized error.
 */
export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new AppError("Authentication required. Please provide a valid token.", 401));
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded.userId) {
      next(new AppError("Invalid token payload.", 401));
      return;
    }

    req.user = decoded;
    next();
  } catch {
    next(new AppError("Invalid or expired token.", 401));
  }
};
