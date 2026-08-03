import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import { runMatchingForSupplier } from "../services/matchingEngine";

// ─── Types ──────────────────────────────────────────────────────────────────

type RunMatchBody = {
  supplierId: string;
  confidenceThreshold?: number;
};

type StatusUpdateBody = {
  status: "APPROVED" | "REJECTED";
};

type LinkMatchBody = {
  supplierProductId: string;
  mainProductId: string;
};

// ─── Controller Methods ─────────────────────────────────────────────────────

/**
 * POST /api/matching/run
 * Trigger the matching engine for a given supplier.
 * Creates candidate ProductMatch records with status PENDING.
 */
export const runMatching = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as RunMatchBody;

    // Validate optional confidenceThreshold
    if (
      body.confidenceThreshold !== undefined &&
      (typeof body.confidenceThreshold !== "number" ||
        body.confidenceThreshold < 0 ||
        body.confidenceThreshold > 1)
    ) {
      throw new AppError(
        "Field 'confidenceThreshold' must be a number between 0 and 1.",
        400,
      );
    }

    const threshold = body.confidenceThreshold;

    // If a supplierId is provided, run matching for that single supplier.
    // Otherwise, run matching for ALL suppliers in the system.
    if (body.supplierId) {
      if (typeof body.supplierId !== "string" || body.supplierId.trim() === "") {
        throw new AppError(
          "Field 'supplierId' must be a non-empty string when provided.",
          400,
        );
      }

      const supplierId = body.supplierId.trim();

      // Verify the supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        throw new AppError(`Supplier with id '${supplierId}' not found.`, 404);
      }

      // Run the matching engine for this supplier
      const result = await runMatchingForSupplier(supplierId, {
        confidenceThreshold: threshold,
      });

      res.status(200).json({
        success: true,
        message: `Matching complete for supplier '${supplier.name}'.`,
        data: result,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // No supplierId → run matching for every supplier in the system.
    const suppliers = await prisma.supplier.findMany({ select: { id: true } });

    if (suppliers.length === 0) {
      res.status(200).json({
        success: true,
        message: "No suppliers found to run matching for.",
        data: { suppliersProcessed: 0, results: [] },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const results = [];
    for (const supplier of suppliers) {
      const result = await runMatchingForSupplier(supplier.id, {
        confidenceThreshold: threshold,
      });
      results.push(result);
    }

    const totals = results.reduce(
      (acc, r) => ({
        totalSupplierProducts: acc.totalSupplierProducts + r.totalSupplierProducts,
        matchesCreated: acc.matchesCreated + r.matchesCreated,
        matchesSkipped: acc.matchesSkipped + r.matchesSkipped,
      }),
      { totalSupplierProducts: 0, matchesCreated: 0, matchesSkipped: 0 },
    );

    res.status(200).json({
      success: true,
      message: `Matching complete for ${results.length} supplier(s).`,
      data: {
        suppliersProcessed: results.length,
        results,
        totals,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/matching
 * Fetch generated matches with optional status filters.
 *
 * Query params:
 *   - status: "PENDING" | "APPROVED" | "REJECTED" (optional)
 *   - supplierId: string (optional, filter by supplier)
 */
export const getMatches = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { status, supplierId } = req.query as {
      status?: string;
      supplierId?: string;
    };

    // Build the where clause
    const where: Record<string, unknown> = {};

    if (status) {
      const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
      if (!validStatuses.includes(status)) {
        throw new AppError(
          `Invalid status '${status}'. Must be one of: ${validStatuses.join(", ")}.`,
          400,
        );
      }
      where.status = status;
    }

    if (supplierId) {
      where.supplierProduct = { supplierId };
    }

    const matches = await prisma.productMatch.findMany({
      where,
      include: {
        mainProduct: {
          select: {
            id: true,
            sku: true,
            name: true,
            price: true,
          },
        },
        supplierProduct: {
          select: {
            id: true,
            rawSku: true,
            rawName: true,
            price: true,
            supplierId: true,
            supplier: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: matches,
      total: matches.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/matching/:id/status
 * Update a match's status to APPROVED or REJECTED.
 */
export const updateMatchStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as StatusUpdateBody;

    // Validate status
    if (!body.status || !["APPROVED", "REJECTED"].includes(body.status)) {
      throw new AppError(
        "Field 'status' is required and must be either 'APPROVED' or 'REJECTED'.",
        400,
      );
    }

    // Ensure the match exists
    const existing = await prisma.productMatch.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(`ProductMatch with id '${id}' not found.`, 404);
    }

    // If approving, reject all other PENDING matches for the same supplier product
    // to avoid duplicate approvals.
    if (body.status === "APPROVED") {
      await prisma.$transaction(async (tx) => {
        // Reject other PENDING matches for the same supplier product
        await tx.productMatch.updateMany({
          where: {
            supplierProductId: existing.supplierProductId,
            id: { not: id },
            status: "PENDING",
          },
          data: { status: "REJECTED" },
        });

        // Update the target match
        await tx.productMatch.update({
          where: { id },
          data: { status: "APPROVED" },
        });
      });
    } else {
      // Simple rejection
      await prisma.productMatch.update({
        where: { id },
        data: { status: "REJECTED" },
      });
    }

    // Fetch the updated match to return
    const updated = await prisma.productMatch.findUnique({
      where: { id },
      include: {
        mainProduct: {
          select: {
            id: true,
            sku: true,
            name: true,
            price: true,
          },
        },
        supplierProduct: {
          select: {
            id: true,
            rawSku: true,
            rawName: true,
            price: true,
            supplierId: true,
            supplier: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
      message: `Match status updated to '${body.status}'.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/matching/link
 * Directly link a specific supplier product to a specific main product by
 * creating (or updating) an APPROVED ProductMatch for that exact pair.
 *
 * This is used by the "Link to Main Product" action in the UI, which lets a
 * user manually confirm a pairing without relying on the auto-matching engine.
 */
export const linkMatch = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as LinkMatchBody;

    // Log the incoming IDs for debugging / traceability.
    console.log(
      `[matching/link] Received link request: mainProductId='${body?.mainProductId}', supplierProductId='${body?.supplierProductId}'`,
    );

    // Validate supplierProductId
    if (
      !body.supplierProductId ||
      typeof body.supplierProductId !== "string" ||
      body.supplierProductId.trim() === ""
    ) {
      throw new AppError(
        "Field 'supplierProductId' is required and must be a non-empty string.",
        400,
      );
    }

    // Validate mainProductId
    if (
      !body.mainProductId ||
      typeof body.mainProductId !== "string" ||
      body.mainProductId.trim() === ""
    ) {
      throw new AppError(
        "Field 'mainProductId' is required and must be a non-empty string.",
        400,
      );
    }

    const supplierProductId = body.supplierProductId.trim();
    const mainProductId = body.mainProductId.trim();

    // Verify both records exist
    const [supplierProduct, mainProduct] = await Promise.all([
      prisma.supplierProduct.findUnique({ where: { id: supplierProductId } }),
      prisma.mainProduct.findUnique({ where: { id: mainProductId } }),
    ]);

    if (!supplierProduct) {
      console.warn(
        `[matching/link] SupplierProduct with id '${supplierProductId}' not found.`,
      );
      throw new AppError(
        `SupplierProduct with id '${supplierProductId}' not found.`,
        404,
      );
    }
    if (!mainProduct) {
      console.warn(
        `[matching/link] MainProduct with id '${mainProductId}' not found.`,
      );
      throw new AppError(`MainProduct with id '${mainProductId}' not found.`, 404);
    }

    // Upsert the match as APPROVED, and reject any other PENDING matches for
    // the same supplier product to avoid duplicate approvals.
    const match = await prisma.$transaction(async (tx) => {
      // Reject other PENDING matches for the same supplier product
      await tx.productMatch.updateMany({
        where: {
          supplierProductId,
          mainProductId: { not: mainProductId },
          status: "PENDING",
        },
        data: { status: "REJECTED" },
      });

      return tx.productMatch.upsert({
        where: {
          mainProductId_supplierProductId: {
            mainProductId,
            supplierProductId,
          },
        },
        create: {
          supplierProductId,
          mainProductId,
          status: "APPROVED",
          confidenceScore: 1.0,
        },
        update: {
          status: "APPROVED",
          confidenceScore: 1.0,
        },
        include: {
          mainProduct: {
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
            },
          },
          supplierProduct: {
            select: {
              id: true,
              rawSku: true,
              rawName: true,
              price: true,
              supplierId: true,
              supplier: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    res.status(200).json({
      success: true,
      data: match,
      message: "Supplier product linked to main product.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};
