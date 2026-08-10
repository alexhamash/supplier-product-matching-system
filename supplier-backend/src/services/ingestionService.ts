import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { fetchAndParseFeed } from "./feedParser";
import { runMatchingForSupplier } from "./matchingEngine";
import { extractSmartSku, extractMpn } from "../utils/skuUtils";

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
  /** Number of products auto-linked to a MainProduct by exact SKU match. */
  autoMatchedCount: number;
  /** Result of the automatic matching recalculation (if it ran). */
  matching?: {
    matchesCreated: number;
    matchesSkipped: number;
  };
  syncedAt: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Link a supplier product to a main product with 100 % confidence, mirroring the
 * manual "link" action in `matchingController.linkMatch`.
 *
 * Creates (or updates) an APPROVED `ProductMatch` for the exact pair, rejects any
 * other PENDING matches for the same supplier product (so the exact-SKU link is
 * the single active suggestion), and persists the link on the `SupplierProduct`
 * via `matchedMainProductId` so it survives reloads / refetches.
 */
const autoLinkExactMatch = async (
  tx: Prisma.TransactionClient,
  supplierProductId: string,
  mainProductId: string,
): Promise<void> => {
  // Reject any other PENDING matches for this supplier product so the exact-SKU
  // link becomes the single active suggestion.
  await tx.productMatch.updateMany({
    where: {
      supplierProductId,
      mainProductId: { not: mainProductId },
      status: "PENDING",
    },
    data: { status: "REJECTED" },
  });

  // Persist the link on the SupplierProduct itself so it survives reloads.
  await tx.supplierProduct.update({
    where: { id: supplierProductId },
    data: { matchedMainProductId: mainProductId },
  });

  await tx.productMatch.upsert({
    where: {
      mainProductId_supplierProductId: { mainProductId, supplierProductId },
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
  });
};

export type LinkExactMatchesResult = {
  supplierId: string;
  /** Number of supplier products newly auto-linked by exact SKU match. */
  autoMatchedCount: number;
};

/**
 * Scan every SupplierProduct belonging to a supplier and auto-link any whose
 * `rawSku` exactly matches an existing `MainProduct.sku` (case-insensitive).
 *
 * This is a post-ingestion pass that complements the inline exact-SKU linking
 * performed during `ingestSupplierFeed`: it also catches products whose matching
 * MainProduct was added to the catalog *after* they were ingested.
 *
 * Existing manual links are preserved — a supplier product already linked to a
 * *different* MainProduct is never overridden.
 */
export const linkExactMatches = async (
  supplierId: string,
): Promise<LinkExactMatchesResult> => {
  // Fetch all supplier products for this supplier.
  const supplierProducts = await prisma.supplierProduct.findMany({
    where: { supplierId },
    select: { id: true, rawSku: true, matchedMainProductId: true },
  });

  if (supplierProducts.length === 0) {
    return { supplierId, autoMatchedCount: 0 };
  }

  // Build a case-insensitive SKU → MainProduct id lookup (O(1) per row).
  const mainProducts = await prisma.mainProduct.findMany({
    select: { id: true, sku: true },
  });
  const mainProductBySku = new Map<string, string>();
  for (const mp of mainProducts) {
    const key = mp.sku.trim().toLowerCase();
    if (!mainProductBySku.has(key)) {
      mainProductBySku.set(key, mp.id);
    }
  }

  let autoMatchedCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const sp of supplierProducts) {
      const exactMatchId = mainProductBySku.get(sp.rawSku.trim().toLowerCase());
      if (!exactMatchId) continue;

      // Preserve existing manual links to a different MainProduct.
      if (
        sp.matchedMainProductId !== null &&
        sp.matchedMainProductId !== exactMatchId
      ) {
        continue;
      }

      await autoLinkExactMatch(tx, sp.id, exactMatchId);
      autoMatchedCount++;
    }
  });

  return { supplierId, autoMatchedCount };
};

export type AutoLinkByExactSkuResult = {
  /** Number of supplier products newly auto-linked by exact SKU match. */
  autoMatchedCount: number;
};

/**
 * Normalise a SKU for fuzzy-but-deterministic exact matching: lowercase it and
 * strip all whitespace and dashes. This lets `ABC-123`, `abc123`, `ABC 123` and
 * `abc-1-2-3` all resolve to the same key, satisfying the "case-insensitive,
 * ignoring whitespace/dashes" requirement.
 */
const normaliseSku = (value: string): string =>
  value.trim().toLowerCase().replace(/[\s-]+/g, "");

/**
 * Scan EVERY unmatched SupplierProduct across all suppliers and auto-link any
 * whose `rawSku` or `smartSku` matches an existing `MainProduct.sku`.
 *
 * Matching is case-insensitive and ignores whitespace and dashes (see
 * `normaliseSku`). The `smartSku` is derived on the fly from the product's
 * title / raw SKU via `extractSmartSku`, mirroring how the parser derives it
 * during ingestion.
 *
 * Only products that are NOT already linked (`matchedMainProductId is null`)
 * are considered, so existing manual links are always preserved. This is a
 * global post-ingestion / post-import pass that runs at the end of every
 * supplier feed sync AND every main products import, so products whose matching
 * MainProduct was added to the catalog *after* they were ingested get linked.
 */
export const autoLinkByExactSku = async (): Promise<AutoLinkByExactSkuResult> => {
  // Fetch every unmatched supplier product (across all suppliers).
  const unmatchedProducts = await prisma.supplierProduct.findMany({
    where: { matchedMainProductId: null },
    select: {
      id: true,
      rawSku: true,
      rawName: true,
      supplier: { select: { name: true } },
    },
  });

  if (unmatchedProducts.length === 0) {
    return { autoMatchedCount: 0 };
  }

  // Build a normalised SKU → MainProduct id lookup (O(1) per row).
  const mainProducts = await prisma.mainProduct.findMany({
    select: { id: true, sku: true },
  });
  const mainProductByNormalisedSku = new Map<string, string>();
  for (const mp of mainProducts) {
    const key = normaliseSku(mp.sku);
    if (key !== "" && !mainProductByNormalisedSku.has(key)) {
      mainProductByNormalisedSku.set(key, mp.id);
    }
  }

  let autoMatchedCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const sp of unmatchedProducts) {
      // Candidate keys: the raw SKU, the derived smart SKU, and the MPN/Model
      // code extracted directly from the title.
      //
      // The title-derived MPN is critical: a supplier product often has an
      // internal database SKU (e.g. `049549`) while its title carries the real
      // manufacturer part number in parentheses (e.g. "Apple HomePod Mini
      // Orange (MJ2D3)"). `extractSmartSku` short-circuits to the raw SKU when
      // it is clean, so we additionally extract the MPN from the title alone to
      // catch codes like `MJ2D3` that only appear in the title.
      const candidates = [
        sp.rawSku,
        extractSmartSku(sp.rawName, sp.rawSku, sp.supplier?.name),
        extractMpn(sp.rawName),
      ];

      let exactMatchId: string | undefined;
      for (const candidate of candidates) {
        if (!candidate) continue;
        const key = normaliseSku(candidate);
        if (key === "") continue;
        const match = mainProductByNormalisedSku.get(key);
        if (match) {
          exactMatchId = match;
          break;
        }
      }

      if (!exactMatchId) continue;

      await autoLinkExactMatch(tx, sp.id, exactMatchId);
      autoMatchedCount++;
    }
  });

  if (autoMatchedCount > 0) {
    console.log(
      `[AutoLink] Auto-linked ${autoMatchedCount} unmatched product(s) by exact SKU.`,
    );
  }

  return { autoMatchedCount };
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
      select: {
        id: true,
        rawSku: true,
        price: true,
        inStock: true,
        matchedMainProductId: true,
      },
    });

    const existingBySku = new Map(
      existingProducts.map((p) => [p.rawSku, p]),
    );

    // Pre-fetch every MainProduct once and index it by case-insensitive SKU so
    // the exact-match lookup below is O(1) per row instead of a query per row.
    // This is equivalent to `findFirst({ where: { sku: { equals, mode: 'insensitive' } } })`
    // but avoids an N+1 query storm during large feed imports.
    const mainProducts = await tx.mainProduct.findMany({
      select: { id: true, sku: true },
    });
    const mainProductBySku = new Map<string, string>();
    for (const mp of mainProducts) {
      const key = mp.sku.trim().toLowerCase();
      if (!mainProductBySku.has(key)) {
        mainProductBySku.set(key, mp.id);
      }
    }

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
    let autoMatchedCount = 0;

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

      // ─── Exact SKU auto-match lookup ───────────────────────────────────────
      // If the parsed supplier SKU (rawSku / smartSku) exactly matches an
      // existing MainProduct.sku (case-insensitive), the product is linked to
      // that MainProduct immediately with 100 % confidence.
      const exactMatchId = mainProductBySku.get(rawSku.trim().toLowerCase());

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
          matchedMainProductId: exactMatchId ?? null,
        });

        // Auto-link on exact SKU match.
        if (exactMatchId) {
          await autoLinkExactMatch(tx, createdRecord.id, exactMatchId);
          autoMatchedCount++;
        }

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

      // ─── Auto-link existing products on exact SKU match ────────────────────
      // Only link when the product is NOT already manually linked to a
      // *different* MainProduct — an existing manual link is preserved unless
      // it already points to the same matched MainProduct (idempotent).
      if (
        exactMatchId &&
        (existing.matchedMainProductId === null ||
          existing.matchedMainProductId === exactMatchId)
      ) {
        await autoLinkExactMatch(tx, existing.id, exactMatchId);
        existingBySku.set(rawSku, {
          ...existing,
          matchedMainProductId: exactMatchId,
        });
        autoMatchedCount++;
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
      autoMatchedCount,
    };
  });

  // Log the exact-SKU auto-match summary for observability.
  if (result.autoMatchedCount > 0) {
    console.log(
      `[Ingestion] Auto-matched ${result.autoMatchedCount} product(s) by exact SKU ` +
        `for supplier '${supplier.name}'.`,
    );
  }

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
    autoMatchedCount: result.autoMatchedCount,
    matching,
    syncedAt: new Date().toISOString(),
  };
};
