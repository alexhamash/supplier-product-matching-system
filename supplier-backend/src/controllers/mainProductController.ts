import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import { importMainProducts } from "../services/mainProductImportService";
import { FeedMappingError } from "../services/feedParser";

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
    // Fetch all main products, dynamically counting the number of linked
    // supplier products. A supplier product is considered "linked" when it has
    // an APPROVED ProductMatch against this main product. PENDING suggestions
    // and REJECTED matches are excluded so the badge reflects real links only.
    const products = await prisma.mainProduct.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            productMatches: {
              where: { status: "APPROVED" },
            },
          },
        },
      },
    });

    // Map each product to the frontend shape, exposing the linked count under
    // the `linkedCount` field expected by the client.
    const data = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      price: p.price,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      linkedCount: p._count.productMatches,
    }));

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

    // Perform the deletion and match cleanup atomically:
    //  1. Unlink every SupplierProduct that was linked to this main product
    //     (clear `matchedMainProductId`) so they become available for matching
    //     again. Their records are preserved.
    //  2. Delete all ProductMatch records referencing this main product.
    //  3. Delete the MainProduct record itself.
    const result = await prisma.$transaction(async (tx) => {
      // Collect the supplier products currently linked to this main product.
      const linkedSupplierProducts = await tx.supplierProduct.findMany({
        where: { matchedMainProductId: id },
        select: { id: true },
      });

      // Unlink them so they can be matched again.
      if (linkedSupplierProducts.length > 0) {
        await tx.supplierProduct.updateMany({
          where: { matchedMainProductId: id },
          data: { matchedMainProductId: null },
        });
      }

      // Delete associated product matches first (foreign key constraint).
      const deletedMatches = await tx.productMatch.deleteMany({
        where: { mainProductId: id },
      });

      await tx.mainProduct.delete({ where: { id } });

      return {
        unlinkedSupplierProducts: linkedSupplierProducts.length,
        deletedMatches: deletedMatches.count,
      };
    });

    res.status(200).json({
      success: true,
      message: "Main product deleted successfully.",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/main-products/:id/matrix
 * Retrieve the consolidated Supplier Matrix for a single main product.
 *
 * Returns the main product's basic info plus an array of matched supplier
 * offers (price, stock status, match score, margin indicators) so the client
 * can render a read-only comparison table.
 */
export const getMainProductMatrix = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    // Fetch the main product (404 if missing)
    const mainProduct = await prisma.mainProduct.findUnique({ where: { id } });
    if (!mainProduct) {
      throw new AppError(`Main product with id '${id}' not found.`, 404);
    }

    // Fetch all matches for this main product, enriched with the supplier
    // product and its supplier. We include ALL statuses so the analyst can see
    // pending suggestions alongside approved links.
    const matches = await prisma.productMatch.findMany({
      where: { mainProductId: id },
      include: {
        supplierProduct: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build the offer list, computing margin indicators relative to the main
    // product's base/target price.
    const offers = matches.map((match) => {
      const sp = match.supplierProduct;
      const priceDiff = sp.price - mainProduct.price;

      return {
        matchId: match.id,
        status: match.status,
        supplierId: sp.supplierId,
        supplierName: sp.supplier.name,
        supplierSku: sp.rawSku,
        supplierTitle: sp.rawName,
        price: sp.price,
        inStock: sp.inStock,
        matchScore: match.confidenceScore ?? 0,
        priceDiff,
        // Margin indicator: negative = cheaper than base price (favourable),
        // positive = more expensive than base price.
        updatedAt: sp.updatedAt.toISOString(),
        lastSyncedAt: sp.supplier.lastSyncedAt?.toISOString() ?? null,
      };
    });

    // ─── Summary statistics ────────────────────────────────────────────────
    const prices = offers.map((o) => o.price);
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;
    const averagePrice =
      prices.length > 0
        ? prices.reduce((sum, p) => sum + p, 0) / prices.length
        : null;

    res.status(200).json({
      success: true,
      data: {
        mainProduct: {
          id: mainProduct.id,
          sku: mainProduct.sku,
          title: mainProduct.name,
          description: mainProduct.description,
          basePrice: mainProduct.price,
          category: mainProduct.description ?? null,
        },
        summary: {
          lowestPrice,
          averagePrice,
          totalSuppliers: offers.length,
          inStockCount: offers.filter((o) => o.inStock).length,
        },
        offers,
      },
      total: offers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/main-products/import
 * Batch-import Main Products into the central catalog from a Google Sheet / CSV
 * feed. Reuses the shared feed-parsing engine and upserts each product by SKU.
 *
 * Request body:
 *   {
 *     feedUrl: string,            // Google Sheets URL or CSV file URL
 *     feedType: "CSV" | "GOOGLE_SHEETS",
 *     sheetGid?: string,          // optional Google Sheet tab/gid
 *     startRow?: number,          // header rows to skip (default 1)
 *     customMapping?: { skuCol, titleCol, priceCol, brandCol?, categoryCol? },
 *     stopWords?: string
 *   }
 *
 * Returns a summary with created / updated item counts.
 */
export const importMainProductsFromFeed = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as {
      feedUrl?: string;
      feedType?: "CSV" | "GOOGLE_SHEETS";
      sheetGid?: string | null;
      startRow?: number | null;
      customMapping?: {
        skuCol?: string;
        titleCol?: string;
        priceCol?: string;
        brandCol?: string;
        categoryCol?: string;
      } | null;
      stopWords?: string | null;
    };

    // ─── Validation ──────────────────────────────────────────────────────────
    if (!body.feedUrl || typeof body.feedUrl !== "string" || body.feedUrl.trim() === "") {
      throw new AppError("Field 'feedUrl' is required and must be a non-empty string.", 400);
    }
    if (body.feedType !== "CSV" && body.feedType !== "GOOGLE_SHEETS") {
      throw new AppError("Field 'feedType' must be one of: CSV, GOOGLE_SHEETS.", 400);
    }

    const result = await importMainProducts(body.feedUrl.trim(), {
      feedType: body.feedType,
      sheetGid: body.sheetGid,
      startRow: body.startRow,
      customMapping: body.customMapping,
      stopWords: body.stopWords,
    });

    res.status(200).json({
      success: true,
      message: `Catalog import completed: ${result.created} created, ${result.updated} updated.`,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Feed column-mapping / validation failures are user errors, not server
    // errors. Surface them as a 400 Bad Request with the parser's message
    // instead of letting them bubble up as an unhandled 500.
    if (err instanceof FeedMappingError) {
      res.status(400).json({
        success: false,
        message: err.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(err);
  }
};
