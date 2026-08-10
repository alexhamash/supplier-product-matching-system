import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import {
  ingestSupplierFeed,
  linkExactMatches,
  autoLinkByExactSku,
} from "../services/ingestionService";
import { toGoogleSheetsCsvUrl, FeedMappingError } from "../services/feedParser";

// ─── Types ──────────────────────────────────────────────────────────────────

type FeedConfigBody = {
  feedUrl?: string;
  feedType?: "CSV" | "GOOGLE_SHEETS";
  autoSync?: boolean;
  sheetGid?: string;
  startRow?: number;
  customMapping?: {
    skuCol?: string;
    titleCol?: string;
    priceCol?: string;
  };
  stopWords?: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const VALID_FEED_TYPES = ["CSV", "GOOGLE_SHEETS"] as const;

/**
 * Validate the feed-config request body.
 * Returns an array of validation error messages (empty = valid).
 */
const validateFeedConfig = (body: Record<string, unknown>): string[] => {
  const errors: string[] = [];

  if (body.feedUrl !== undefined) {
    if (typeof body.feedUrl !== "string" || body.feedUrl.trim() === "") {
      errors.push("Field 'feedUrl' must be a non-empty string when provided.");
    }
  }

  if (body.feedType !== undefined) {
    if (
      typeof body.feedType !== "string" ||
      !VALID_FEED_TYPES.includes(body.feedType as (typeof VALID_FEED_TYPES)[number])
    ) {
      errors.push(
        `Field 'feedType' must be one of: ${VALID_FEED_TYPES.join(", ")}.`,
      );
    }
  }

  if (body.autoSync !== undefined && typeof body.autoSync !== "boolean") {
    errors.push("Field 'autoSync' must be a boolean when provided.");
  }

  if (body.sheetGid !== undefined) {
    if (typeof body.sheetGid !== "string") {
      errors.push("Field 'sheetGid' must be a string when provided.");
    }
  }

  if (body.startRow !== undefined) {
    if (
      typeof body.startRow !== "number" ||
      !Number.isInteger(body.startRow) ||
      body.startRow < 1
    ) {
      errors.push(
        "Field 'startRow' must be a positive integer (>= 1) when provided.",
      );
    }
  }

  if (body.customMapping !== undefined) {
    if (
      typeof body.customMapping !== "object" ||
      body.customMapping === null ||
      Array.isArray(body.customMapping)
    ) {
      errors.push(
        "Field 'customMapping' must be an object like { skuCol, titleCol, priceCol } when provided.",
      );
    } else {
      const { skuCol, titleCol, priceCol } = body.customMapping as {
        skuCol?: string;
        titleCol?: string;
        priceCol?: string;
      };
      for (const [key, value] of [
        ["skuCol", skuCol],
        ["titleCol", titleCol],
        ["priceCol", priceCol],
      ] as const) {
        if (value !== undefined && (typeof value !== "string" || value.trim() === "")) {
          errors.push(
            `Field 'customMapping.${key}' must be a non-empty string (column letter) when provided.`,
          );
        }
      }
    }
  }

  if (body.stopWords !== undefined && typeof body.stopWords !== "string") {
    errors.push("Field 'stopWords' must be a string when provided.");
  }

  return errors;
};

// ─── Controller Methods ─────────────────────────────────────────────────────

/**
 * POST /api/suppliers/:id/sync
 * Trigger an immediate manual sync for a specific supplier.
 *
 * Fetches the configured feed, upserts products, handles out-of-stock
 * transitions, recalculates matches for new products, and updates
 * `lastSyncedAt`.
 */
export const syncSupplierFeed = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
   const supplierId = req.params.id as string;

   console.log(
     "[IMPORT STARTED] Triggered import for supplier:",
     req.params.id || req.body,
   );

   const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) {
      throw new AppError(`Supplier with id '${supplierId}' not found.`, 404);
    }

    if (!supplier.feedUrl) {
      throw new AppError(
        `Supplier '${supplier.name}' has no feedUrl configured. ` +
          `Set a feed URL via PATCH /api/suppliers/${supplierId}/feed-config before syncing.`,
        400,
      );
    }

    const result = await ingestSupplierFeed(supplierId);

    // Run the exact-SKU auto-link pass after ingestion completes. This catches
    // any supplier products whose matching MainProduct was added to the catalog
    // after they were ingested, and returns the authoritative auto-match count.
    const exactMatchResult = await linkExactMatches(supplierId);

    // Run the global auto-link pass across ALL unmatched supplier products. This
    // runs at the end of every supplier feed sync so any product that was not
    // linked during ingestion (e.g. its MainProduct was added later) still gets
    // linked when its SKU exactly matches a MainProduct SKU.
    const globalAutoLinkResult = await autoLinkByExactSku();

    res.status(200).json({
      success: true,
      message: `Feed sync completed for supplier '${supplier.name}'.`,
      data: {
        ...result,
        autoMatchedCount:
          exactMatchResult.autoMatchedCount + globalAutoLinkResult.autoMatchedCount,
      },
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

/**
 * PATCH /api/suppliers/:id/feed-config
 * Update the feed configuration for a supplier:
 *   - feedUrl: URL to the Google Sheet or CSV file.
 *   - feedType: 'CSV' | 'GOOGLE_SHEETS'.
 *   - autoSync: toggle for automated cron ingestion.
 */
export const updateSupplierFeedConfig = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const supplierId = req.params.id as string;
    const body = req.body as FeedConfigBody;

    // Validate input
    const validationErrors = validateFeedConfig(body);
    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(" "), 400);
    }

    // Verify the supplier exists
    const existing = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!existing) {
      throw new AppError(`Supplier with id '${supplierId}' not found.`, 404);
    }

    // Build the update payload
    const data: {
      feedUrl?: string | null;
      feedType?: "CSV" | "GOOGLE_SHEETS";
      autoSync?: boolean;
      sheetGid?: string | null;
      startRow?: number;
      customMapping?: {
        skuCol?: string;
        titleCol?: string;
        priceCol?: string;
      };
      stopWords?: string | null;
    } = {};

    if (body.feedUrl !== undefined) {
      data.feedUrl = body.feedUrl.trim() === "" ? null : body.feedUrl.trim();
    }
    if (body.feedType !== undefined) {
      data.feedType = body.feedType;
    }
    if (body.autoSync !== undefined) {
      data.autoSync = body.autoSync;
    }
    if (body.sheetGid !== undefined) {
      data.sheetGid = body.sheetGid.trim() === "" ? null : body.sheetGid.trim();
    }
    if (body.startRow !== undefined) {
      data.startRow = body.startRow;
    }
    if (body.customMapping !== undefined) {
      data.customMapping = body.customMapping;
    }
    if (body.stopWords !== undefined) {
      data.stopWords = body.stopWords.trim() === "" ? null : body.stopWords.trim();
    }

    // If a Google Sheets URL is provided, validate it can be converted to a
    // CSV export URL so we fail fast on malformed URLs.
    const effectiveFeedType = data.feedType ?? existing.feedType;
    if (data.feedUrl && effectiveFeedType === "GOOGLE_SHEETS") {
      if (!toGoogleSheetsCsvUrl(data.feedUrl)) {
        throw new AppError(
          "Field 'feedUrl' is not a valid Google Sheets URL for feedType 'GOOGLE_SHEETS'.",
          400,
        );
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data,
    });

    res.status(200).json({
      success: true,
      message: "Supplier feed configuration updated successfully.",
      data: {
        id: supplier.id,
        name: supplier.name,
        feedUrl: supplier.feedUrl,
        feedType: supplier.feedType,
        autoSync: supplier.autoSync,
        lastSyncedAt: supplier.lastSyncedAt,
        sheetGid: supplier.sheetGid,
        startRow: supplier.startRow,
        customMapping: supplier.customMapping,
        stopWords: supplier.stopWords,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};
