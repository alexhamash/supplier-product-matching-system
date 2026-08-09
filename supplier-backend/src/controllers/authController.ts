import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";

// ─── JWT Secret & Expiry ────────────────────────────────────────────────────

const JWT_SECRET: string = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

// ─── Types ──────────────────────────────────────────────────────────────────

type RegisterBody = {
  email: string;
  password: string;
  name: string;
};

type LoginBody = {
  email: string;
  password: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generate a signed JWT for a given user.
 */
const signToken = (userId: string, email: string): string =>
  jwt.sign({ userId, email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);

/**
 * Validate the registration payload.
 * Returns an array of validation error messages (empty = valid).
 */
const validateRegister = (body: Record<string, unknown>): string[] => {
  const errors: string[] = [];

  if (!body.email || typeof body.email !== "string" || !body.email.trim()) {
    errors.push("Field 'email' is required and must be a non-empty string.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    errors.push("Field 'email' must be a valid email address.");
  }

  if (!body.password || typeof body.password !== "string" || body.password.length < 6) {
    errors.push("Field 'password' is required and must be at least 6 characters long.");
  }

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    errors.push("Field 'name' is required and must be a non-empty string.");
  }

  return errors;
};

/**
 * Validate the login payload.
 */
const validateLogin = (body: Record<string, unknown>): string[] => {
  const errors: string[] = [];

  if (!body.email || typeof body.email !== "string" || !body.email.trim()) {
    errors.push("Field 'email' is required.");
  }

  if (!body.password || typeof body.password !== "string" || !body.password) {
    errors.push("Field 'password' is required.");
  }

  return errors;
};

// ─── Controller Methods ─────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Create a new user account and return a JWT token.
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as RegisterBody;

    // Validate input
    const validationErrors = validateRegister(body);
    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(" "), 400);
    }

    const email = body.email.trim().toLowerCase();

    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("A user with this email already exists.", 409);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: body.name.trim(),
      },
    });

    // Generate JWT
    const token = signToken(user.id, user.email);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      },
      message: "Registration successful.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Authenticate a user and return a JWT token.
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as LoginBody;

    // Validate input
    const validationErrors = validateLogin(body);
    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(" "), 400);
    }

    const email = body.email.trim().toLowerCase();

    // Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("Invalid email or password.", 401);
    }

    // Verify the password
    const passwordMatch = await bcrypt.compare(body.password, user.password);
    if (!passwordMatch) {
      throw new AppError("Invalid email or password.", 401);
    }

    // Generate JWT
    const token = signToken(user.id, user.email);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      },
      message: "Login successful.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};
