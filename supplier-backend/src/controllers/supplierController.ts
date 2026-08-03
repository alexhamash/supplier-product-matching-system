import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";

// ─── Helpers ────────────────────────────────────────────────────────────────

type SupplierBody = {
  name: string;
  contactInfo?: string;
};

/**
 * Validate the request body for creating a supplier.
 * Returns an array of validation error messages (empty = valid).
 */
const validateSupplier = (body: Record<string, unknown>): string[] => {
  const errors: string[] = [];

  if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
    errors.push("Field 'name' is required and must be a non-empty string.");
  }

  return errors;
};

// ─── Controller Methods ─────────────────────────────────────────────────────

/**
 * GET /api/suppliers
 * Retrieve all suppliers, ordered by creation date descending.
 * Includes the count of associated supplier products.
 */
export const getAllSuppliers = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { supplierProducts: true },
        },
      },
    });

    // Flatten _count into a productsCount field for convenience
    const result = suppliers.map(({ _count, ...rest }) => ({
      ...rest,
      productsCount: _count.supplierProducts,
    }));

    res.status(200).json({
      success: true,
      data: result,
      total: result.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/suppliers
 * Create a new supplier.
 */
export const createSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as SupplierBody;

    // Validate input
    const validationErrors = validateSupplier(body);
    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(" "), 400);
    }

    // Check for duplicate name
    const existing = await prisma.supplier.findUnique({
      where: { name: body.name.trim() },
    });
    if (existing) {
      throw new AppError(`A supplier with name '${body.name}' already exists.`, 409);
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: body.name.trim(),
        contactInfo: body.contactInfo?.trim() ?? null,
      },
    });

    res.status(201).json({
      success: true,
      data: supplier,
      message: "Supplier created successfully.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/suppliers/:id
 * Delete a supplier by its UUID.
 * Also removes all associated supplier products and their matches.
 */
export const deleteSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(`Supplier with id '${id}' not found.`, 404);
    }

    // Cascade delete: first remove product matches, then supplier products, then the supplier
    const supplierProducts = await prisma.supplierProduct.findMany({
      where: { supplierId: id },
      select: { id: true },
    });
    const supplierProductIds = supplierProducts.map((sp) => sp.id);

    if (supplierProductIds.length > 0) {
      await prisma.productMatch.deleteMany({
        where: { supplierProductId: { in: supplierProductIds } },
      });
      await prisma.supplierProduct.deleteMany({
        where: { supplierId: id },
      });
    }

    await prisma.supplier.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Supplier deleted successfully.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};
