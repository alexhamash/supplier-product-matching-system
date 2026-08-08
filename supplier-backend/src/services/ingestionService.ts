import { prisma } from "../lib/prisma";
import { fetchAndParseFeed } from "./feedParser";
import { runMatchingForSupplier } from "./matchingEngine";

// ─── Types ──────────────────────────────────────────────────────────────────

export type IngestionResult = {
  supplierId: string;
  supplierName: string;
  feedUrl: string;
  feedType: string;
  /** Total rows parsed from the feed. */
  totalRows: number;
  /** Rows that were invalid / skipped during parsing. */
  skippedRows: number;
  /** Number of new SupplierProduct records created. */
  created: number;
  /** Number of existing SupplierProduct records updated. */
  updated: number;
  /** Number of previously-existing products marked out-of-stock. */
  markedOutOfStock: number;
  /** Number of products that were already in stock and unchanged. */
  unchanged: number;
  /** Result of the automatic matching recalculation (if it ran). */
  matching?: {
    matchesCreated: number;
    matchesSkipped: number;
  };
  syncedAt: string;
};

// ─── Ingestion Engine ───────────────────────────────────────────────────────

/**
 * Run the full ingestion pipeline for a single supplier.
 *
 * Steps:
 *  1. Fetch the CSV / Google Sheets feed.
 *  2. Parse it into structured product rows (presence ⇒ in stock).
 *  3. Within a transaction, upsert products by `(supplierId, rawSku)`:
 *       - Existing SKU  → update price/title, set `inStock = true`.
 *       - New SKU       → create with `inStock = true`.
 *       - Missing SKU   → mark existing products `inStock = false`.
 *  4. If new products were added, trigger automatic matching recalculation.
 *  5. Update `lastSyncedAt` on the Supplier.
 *
 * Throws if the feed cannot be fetched or parsed (caller is responsible for
 * error handling / logging so one failing feed doesn't break the whole job).
 */
export const ingestSupplierFeed = async (
  supplierId: string,
): Promise<IngestionResult> => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });

  if (!supplier) {
    throw new Error(`Supplier with id '${supplierId}' not found.`);
  }

  if (!supplier.feedUrl) {
    throw new Error(
      `Supplier '${supplier.name}' has no feedUrl configured. Configure a feed before syncing.`,
    );
  }

  // 1 & 2. Fetch and parse the feed, honouring the supplier's advanced feed
  // configuration (sheet tab/gid, start row, custom column mapping, stop words).
  const { products, skippedRows } = await fetchAndParseFeed(
    supplier.feedUrl,
    supplier.feedType,
    {
      sheetGid: supplier.sheetGid,
      startRow: supplier.startRow,
      customMapping: supplier.customMapping as
        | { skuCol?: string; titleCol?: string; priceCol?: string }
        | null
        | undefined,
      stopWords: supplier.stopWords,
    },
  );

  const totalRows = products.length;
  const skusInFeed = new Set(products.map((p) => p.sku));

  // 3. Upsert products and handle out-of-stock transitions inside a transaction.
  const result = await prisma.$transaction(async (tx) => {
    // Fetch all existing products for this supplier.
    const existingProducts = await tx.supplierProduct.findMany({
      where: { supplierId },
      select: { id: true, rawSku: true, price: true, inStock: true },
    });

    const existingBySku = new Map(
      existingProducts.map((p) => [p.rawSku, p]),
    );

    let created = 0;
    let updated = 0;
    let unchanged = 0;

    for (const product of products) {
      const existing = existingBySku.get(product.sku);

      if (!existing) {
        // New SKU → create.
        await tx.supplierProduct.create({
          data: {
            supplierId,
            rawSku: product.sku,
            rawName: product.name,
            price: product.price,
            inStock: true,
          },
        });
        created++;
        continue;
      }

      // Existing SKU → update price/title and ensure it's in stock.
      const needsUpdate =
        existing.inStock !== true ||
        existing.price !== product.price;

      if (needsUpdate) {
        await tx.supplierProduct.update({
          where: { id: existing.id },
          data: {
            rawName: product.name,
            price: product.price,
            inStock: true,
          },
        });
        updated++;
      } else {
        unchanged++;
      }
    }

    // Mark previously-existing products that are missing from the feed as out of stock.
    const missingSkus = existingProducts
      .filter((p) => !skusInFeed.has(p.rawSku) && p.inStock === true)
      .map((p) => p.id);

    if (missingSkus.length > 0) {
      await tx.supplierProduct.updateMany({
        where: { id: { in: missingSkus } },
        data: { inStock: false },
      });
    }

    // Update the supplier's lastSyncedAt timestamp.
    await tx.supplier.update({
      where: { id: supplierId },
      data: { lastSyncedAt: new Date() },
    });

    return {
      created,
      updated,
      unchanged,
      markedOutOfStock: missingSkus.length,
    };
  });

  // 4. Trigger automatic matching recalculation if new products were added.
  let matching: IngestionResult["matching"];
  if (result.created > 0) {
    const matchResult = await runMatchingForSupplier(supplierId);
    matching = {
      matchesCreated: matchResult.matchesCreated,
      matchesSkipped: matchResult.matchesSkipped,
    };
  }

  return {
    supplierId,
    supplierName: supplier.name,
    feedUrl: supplier.feedUrl,
    feedType: supplier.feedType,
    totalRows,
    skippedRows,
    created: result.created,
    updated: result.updated,
    markedOutOfStock: result.markedOutOfStock,
    unchanged: result.unchanged,
    matching,
    syncedAt: new Date().toISOString(),
  };
};
