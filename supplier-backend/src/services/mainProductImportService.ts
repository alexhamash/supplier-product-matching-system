import { prisma } from "../lib/prisma";
import { fetchAndParseFeed } from "./feedParser";
import type { FeedColumnMapping } from "./feedParser";

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Options for importing Main Products from a Google Sheet / CSV feed.
 * Mirrors the advanced feed configuration used for supplier ingestion.
 */
export type MainProductImportOptions = {
  /** Feed type — either a raw CSV file or a Google Sheet. */
  feedType: "CSV" | "GOOGLE_SHEETS";
  /** Specific Google Sheet tab/gid ID (e.g. '0' or '18492049'). */
  sheetGid?: string | null;
  /** Number of header rows to skip before parsing products (default 1). */
  startRow?: number | null;
  /** Manual column definitions (letters), e.g. { skuCol: "A", titleCol: "B", priceCol: "C" }. */
  customMapping?: FeedColumnMapping | null;
  /** Comma-separated negative keywords; rows whose title contains any are skipped. */
  stopWords?: string | null;
};

/**
 * Result of a Main Product import run.
 */
export type MainProductImportResult = {
  /** Total rows parsed from the feed. */
  totalRows: number;
  /** Rows that were invalid / skipped during parsing. */
  skippedRows: number;
  /** Number of new MainProduct records created. */
  created: number;
  /** Number of existing MainProduct records updated (matched by SKU). */
  updated: number;
  /** Number of rows that had no usable SKU and were skipped. */
  skippedNoSku: number;
  importedAt: string;
};

// ─── Import Engine ───────────────────────────────────────────────────────────

/**
 * Import Main Products into the central catalog from a Google Sheet / CSV feed.
 *
 * The feed is fetched and parsed using the shared `feedParser` utilities (the
 * same engine that powers supplier ingestion). Each parsed row is then upserted
 * into the `MainProduct` table using `sku` as the unique lookup identifier:
 *   - A row whose SKU does not exist yet → a new MainProduct is created.
 *   - A row whose SKU already exists → the existing MainProduct is updated
 *     (name, description, price).
 *
 * Because the `MainProduct` schema has no dedicated brand/category columns,
 * any brand/category captured from the feed is combined into the `description`
 * field (mirroring how the frontend maps `category` → `description`).
 *
 * @param feedUrl  The Google Sheets URL or CSV file URL to import from.
 * @param options  Feed type and advanced parsing options.
 * @returns A summary of created / updated item counts.
 */
export const importMainProducts = async (
  feedUrl: string,
  options: MainProductImportOptions,
): Promise<MainProductImportResult> => {
  // 1 & 2. Fetch and parse the feed, honouring the advanced feed configuration.
  const { products, skippedRows } = await fetchAndParseFeed(feedUrl, options.feedType, {
    sheetGid: options.sheetGid,
    startRow: options.startRow,
    customMapping: options.customMapping,
    stopWords: options.stopWords,
  });

  const totalRows = products.length;

  // 3. Upsert products by SKU inside a transaction.
  const result = await prisma.$transaction(async (tx) => {
    // Fetch all existing main products keyed by SKU for fast lookup.
    const existingProducts = await tx.mainProduct.findMany({
      select: { id: true, sku: true, name: true, description: true, price: true },
    });
    const existingBySku = new Map(existingProducts.map((p) => [p.sku, p]));

    // Tracks SKUs already used in THIS batch so duplicate SKUs within a single
    // feed payload are disambiguated with a numeric suffix (e.g. `SKU-2`),
    // keeping every SKU unique for the catalog.
    const seenSkusInBatch = new Set<string>();

    let created = 0;
    let updated = 0;
    let skippedNoSku = 0;

    for (const product of products) {
      // ─── Resolve a unique SKU for this row within the batch ────────────────
      // The first occurrence of a SKU keeps the base value; later occurrences
      // get a numeric suffix so they never collide on the unique `sku` column.
      let sku = product.sku.trim();
      if (sku === "") {
        skippedNoSku++;
        continue;
      }

      if (seenSkusInBatch.has(sku)) {
        let suffix = 2;
        let candidate = `${sku}-${suffix}`;
        while (seenSkusInBatch.has(candidate) || existingBySku.has(candidate)) {
          suffix++;
          candidate = `${sku}-${suffix}`;
        }
        sku = candidate;
      }
      seenSkusInBatch.add(sku);

      // Combine brand / category into the description field (the schema has no
      // dedicated columns). Only include non-empty parts.
      const descriptionParts = [product.brand, product.category].filter(
        (part): part is string => Boolean(part && part.trim() !== ""),
      );
      const description = descriptionParts.length > 0
        ? descriptionParts.join(" · ")
        : null;

      const existing = existingBySku.get(sku);

      if (!existing) {
        // New SKU → create.
        await tx.mainProduct.create({
          data: {
            sku,
            name: product.name,
            description,
            price: product.price,
          },
        });
        existingBySku.set(sku, {
          id: "",
          sku,
          name: product.name,
          description,
          price: product.price,
        });
        created++;
        continue;
      }

      // Existing SKU → update name / description / price.
      const needsUpdate =
        existing.name !== product.name ||
        existing.description !== description ||
        existing.price !== product.price;

      if (needsUpdate) {
        await tx.mainProduct.update({
          where: { sku },
          data: {
            name: product.name,
            description,
            price: product.price,
          },
        });
        existingBySku.set(sku, {
          ...existing,
          name: product.name,
          description,
          price: product.price,
        });
        updated++;
      }
    }

    return { created, updated, skippedNoSku };
  });

  return {
    totalRows,
    skippedRows,
    created: result.created,
    updated: result.updated,
    skippedNoSku: result.skippedNoSku,
    importedAt: new Date().toISOString(),
  };
};
