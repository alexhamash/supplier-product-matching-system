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
 * IMPORTANT: SupplierProduct records are NEVER deleted during a sync. Deleting
 * them would destroy existing ProductMatch relations. Instead, availability is
 * updated so matches are preserved when products reappear in a later feed.
 *
 * Steps:
 *  1. Fetch the CSV / Google Sheets feed.
 *  2. Parse it into structured product rows.
 *  3. Within a transaction, upsert products by `(supplierId, rawSku)`:
 *       - Present WITH a valid price (`price > 0`) → update price/title and set
 *         `inStock = true` (available).
 *       - Present WITHOUT a valid price (`price <= 0` / null) → set
 *         `inStock = false` and `price = null` (unavailable). (The parser
 *         normally filters these out, but this guards against bypasses.)
 *       - Missing from the feed entirely → keep the record to preserve
 *         ProductMatch relations, but set `inStock = false` (unavailable).
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
      supplierName: supplier.name,
    },
  );

  const totalRows = products.length;

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

    // Tracks rawSkus already used in THIS batch so duplicate SKUs within a single
    // feed payload are disambiguated with a numeric suffix (e.g. `GRO-8F92A-2`),
    // keeping every rawSku unique for the supplier. This covers both duplicate
    // rows in the feed and two different titles hashing to the same fallback SKU.
    const seenSkusInBatch = new Set<string>();
    // The rawSkus actually stored this run (used to detect out-of-stock rows).
    const storedSkus = new Set<string>();

    let created = 0;
    let updated = 0;
    let unchanged = 0;

    for (const product of products) {
      // ─── Resolve a unique rawSku for this row within the batch ─────────────
      // The first occurrence of a rawSku keeps the base SKU; later occurrences
      // get a numeric suffix so they never collide on (supplierId, rawSku).
      let rawSku = product.sku;
      if (seenSkusInBatch.has(rawSku)) {
        let suffix = 2;
        let candidate = `${rawSku}-${suffix}`;
        while (
          seenSkusInBatch.has(candidate) ||
          existingBySku.has(candidate)
        ) {
          suffix++;
          candidate = `${rawSku}-${suffix}`;
        }
        rawSku = candidate;
      }
      seenSkusInBatch.add(rawSku);
      storedSkus.add(rawSku);

      const existing = existingBySku.get(rawSku);

      // A product is "available" only when it has a valid, positive price.
      // Unpriced rows are stored with `price: 0` (the schema's `price` column is
      // non-nullable) and marked unavailable. The parser normally filters these
      // out, so this is a defensive guard against bypasses.
      const isAvailable = product.price > 0;
      const effectivePrice = isAvailable ? product.price : 0;

      if (!existing) {
        // New SKU → create.
        const createdRecord = await tx.supplierProduct.create({
          data: {
            supplierId,
            rawSku,
            rawName: product.name,
            price: effectivePrice,
            inStock: isAvailable,
          },
        });
        // Track it so a later duplicate in the same batch resolves correctly.
        existingBySku.set(rawSku, {
          id: createdRecord.id,
          rawSku,
          price: effectivePrice,
          inStock: isAvailable,
        });
        created++;
        continue;
      }

      // Existing SKU → update price/title and availability. The compound unique
      // key (supplierId, rawSku) is used directly so the update targets exactly
      // the record the unique constraint refers to.
      const needsUpdate =
        existing.inStock !== isAvailable ||
        existing.price !== effectivePrice;

      if (needsUpdate) {
        await tx.supplierProduct.update({
          where: { supplierId_rawSku: { supplierId, rawSku } },
          data: {
            rawName: product.name,
            price: effectivePrice,
            inStock: isAvailable,
          },
        });
        existingBySku.set(rawSku, {
          ...existing,
          price: effectivePrice,
          inStock: isAvailable,
        });
        updated++;
      } else {
        unchanged++;
      }
    }

    // Products missing from the feed entirely are marked unavailable, but their
    // records are KEPT so existing ProductMatch relations are preserved. Only
    // transition products that are currently available (avoid redundant writes).
    const missingSkus = existingProducts
      .filter((p) => !storedSkus.has(p.rawSku) && p.inStock === true)
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
