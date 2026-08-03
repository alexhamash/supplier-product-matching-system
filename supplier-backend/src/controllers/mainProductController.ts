import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";

// ─── Helpers ────────────────────────────────────────────────────────────────

type MainProductBody = {
  sku: string;
  name: string;
  description?: string;
  price: number;
};

/**
 * Validate the request body for creating / updating a main product.
 * Returns an array of validation error messages (empty = valid).
 */
const validateMainProduct = (body: Record<string, unknown>): string[] => {
  const errors: string[] = [];

  if (!body.sku || typeof body.sku !== "string" || body.sku.trim() === "") {
    errors.push("Field 'sku' is required and must be a non-empty string.");
  }
  if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
    errors.push("Field 'name' is required and must be a non-empty string.");
  }
  if (
    body.price === undefined ||
    body.price === null ||
    typeof Number(body.price) !== "number" ||
    Number.isNaN(Number(body.price))
  ) {
    errors.push("Field 'price' is required and must be a valid number.");
  }

  return errors;
};

// ─── Controller Methods ─────────────────────────────────────────────────────

/**
 * GET /api/main-products
 * Retrieve all main products, ordered by creation date descending.
 */
export const getAllMainProducts = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const products = await prisma.mainProduct.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: products,
      total: products.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/main-products
 * Create a new main product.
 */
export const createMainProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as MainProductBody;

    // Validate input
    const validationErrors = validateMainProduct(body);
    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(" "), 400);
    }

    // Check for duplicate SKU
    const existing = await prisma.mainProduct.findUnique({
      where: { sku: body.sku.trim() },
    });
    if (existing) {
      throw new AppError(`A product with SKU '${body.sku}' already exists.`, 409);
    }

    const product = await prisma.mainProduct.create({
      data: {
        sku: body.sku.trim(),
        name: body.name.trim(),
        description: body.description?.trim() ?? null,
        price: Number(body.price),
      },
    });

    res.status(201).json({
      success: true,
      data: product,
      message: "Main product created successfully.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/main-products/:id
 * Update an existing main product by its UUID.
 */
export const updateMainProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as Partial<MainProductBody>;

    // Ensure the product exists
    const existing = await prisma.mainProduct.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(`Main product with id '${id}' not found.`, 404);
    }

    // If SKU is being changed, check for duplicates
    if (body.sku && body.sku.trim() !== existing.sku) {
      const duplicate = await prisma.mainProduct.findUnique({
        where: { sku: body.sku.trim() },
      });
      if (duplicate) {
        throw new AppError(`A product with SKU '${body.sku}' already exists.`, 409);
      }
    }

    const updated = await prisma.mainProduct.update({
      where: { id },
      data: {
        ...(body.sku !== undefined && { sku: body.sku.trim() }),
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && {
          description: body.description?.trim() ?? null,
        }),
        ...(body.price !== undefined && { price: Number(body.price) }),
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
      message: "Main product updated successfully.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/main-products/:id
 * Delete a main product by its UUID.
 */
export const deleteMainProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.mainProduct.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(`Main product with id '${id}' not found.`, 404);
    }

    // Delete associated product matches first (foreign key constraint)
    await prisma.productMatch.deleteMany({ where: { mainProductId: id } });

    await prisma.mainProduct.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Main product deleted successfully.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};
