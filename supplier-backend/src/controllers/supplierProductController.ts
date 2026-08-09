import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";

// ─── Types ──────────────────────────────────────────────────────────────────

type RawProductInput = {
  rawSku: string;
  rawName: string;
  price: number;
};

type ImportBody = {
  products: RawProductInput[];
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Validate a single raw product entry.
 * Returns an error message string, or null if valid.
 */
const validateRawProduct = (
  product: Record<string, unknown>,
  index: number,
): string | null => {
  if (
    !product.rawSku ||
    typeof product.rawSku !== "string" ||
    product.rawSku.trim() === ""
  ) {
    return `products[${index}].rawSku is required and must be a non-empty string.`;
  }
  if (
    !product.rawName ||
    typeof product.rawName !== "string" ||
    product.rawName.trim() === ""
  ) {
    return `products[${index}].rawName is required and must be a non-empty string.`;
  }
  if (
    product.price === undefined ||
    product.price === null ||
    typeof Number(product.price) !== "number" ||
    Number.isNaN(Number(product.price))
  ) {
    return `products[${index}].price is required and must be a valid number.`;
  }
  return null;
};

/**
 * Validate the full import request body.
 * Returns an array of validation error messages (empty = valid).
 */
const validateImportBody = (body: Record<string, unknown>): string[] => {
  const errors: string[] = [];

  if (!Array.isArray(body.products) || body.products.length === 0) {
    errors.push("Field 'products' is required and must be a non-empty array.");
    return errors;
  }

  body.products.forEach((product, index) => {
    const err = validateRawProduct(product as Record<string, unknown>, index);
    if (err) {
      errors.push(err);
    }
  });

  return errors;
};

// ─── Controller Methods ─────────────────────────────────────────────────────

/**
 * POST /api/suppliers/:id/products
 * Import / ingest a batch of raw products for a specific supplier.
 *
 * Uses a Prisma transaction with `createMany` for efficient bulk insertion.
 * Duplicate (supplierId + rawSku) entries are skipped via `skipDuplicates: true`.
 */
export const importSupplierProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const supplierId = req.params.id as string;
    const body = req.body as ImportBody;

    // Validate input
    const validationErrors = validateImportBody(body);
    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(" "), 400);
    }

    // Verify the supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) {
      throw new AppError(`Supplier with id '${supplierId}' not found.`, 404);
    }

    // Prepare data for insertion
    const data = body.products.map((p) => ({
      supplierId,
      rawSku: p.rawSku.trim(),
      rawName: p.rawName.trim(),
      price: Number(p.price),
    }));

    // Use a transaction to insert products and return the count
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.supplierProduct.createMany({
        data,
        skipDuplicates: true,
      });

      return { importedCount: created.count };
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${result.importedCount} product(s).`,
      data: {
        supplierId,
        requestedCount: data.length,
        importedCount: result.importedCount,
        skippedCount: data.length - result.importedCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/suppliers/:id/products
 * Fetch all imported products for a specific supplier.
 */
export const getSupplierProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const supplierId = req.params.id as string;

    // Verify the supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) {
      throw new AppError(`Supplier with id '${supplierId}' not found.`, 404);
    }

    const products = await prisma.supplierProduct.findMany({
      where: { supplierId },
      // Include the linked MainProduct (via the APPROVED ProductMatch) so the
      // client can render the "Matched" state and the linked main product's
      // name / SKU without an extra round-trip. PENDING suggestions and
      // REJECTED matches are excluded — only real links count as "matched".
      include: {
        matches: {
          where: { status: "APPROVED" },
          include: {
            mainProduct: {
              select: {
                id: true,
                sku: true,
                name: true,
                price: true,
              },
            },
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map each product to the frontend shape, exposing an `isMatched` flag and
    // the linked `linkedMainProduct` info (or null when not linked).
    const data = products.map((p) => {
      const approved = p.matches[0];
      return {
        id: p.id,
        supplierId: p.supplierId,
        rawSku: p.rawSku,
        rawName: p.rawName,
        price: p.price,
        inStock: p.inStock,
        matchedMainProductId: p.matchedMainProductId,
        isMatched: Boolean(approved?.mainProduct),
        linkedMainProduct: approved?.mainProduct ?? null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data,
      total: data.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/suppliers/:id/products
 * Clear all products for a specific supplier.
 * Also removes associated product matches.
 */
export const clearSupplierProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const supplierId = req.params.id as string;

    // Verify the supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) {
      throw new AppError(`Supplier with id '${supplierId}' not found.`, 404);
    }

    // Use a transaction to delete matches first, then products
    await prisma.$transaction(async (tx) => {
      // Find all supplier product IDs for this supplier
      const supplierProducts = await tx.supplierProduct.findMany({
        where: { supplierId },
        select: { id: true },
      });
      const supplierProductIds = supplierProducts.map((sp) => sp.id);

      // Delete associated product matches
      if (supplierProductIds.length > 0) {
        await tx.productMatch.deleteMany({
          where: { supplierProductId: { in: supplierProductIds } },
        });
      }

      // Delete all supplier products
      await tx.supplierProduct.deleteMany({
        where: { supplierId },
      });
    });

    res.status(200).json({
      success: true,
      message: "All supplier products cleared successfully.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};
