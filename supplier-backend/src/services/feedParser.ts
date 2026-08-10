import axios from "axios";
import { parse } from "csv-parse/sync";
import type { FeedType } from "@prisma/client";
import { extractSmartSku } from "../utils/skuUtils";

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * A single parsed product row extracted from a price feed.
 * Presence of a row in the feed implies the product is in stock.
 */
export type ParsedFeedProduct = {
  sku: string;
  name: string;
  price: number;
};

export type ParseFeedResult = {
  products: ParsedFeedProduct[];
  /** Number of rows that were skipped because they were invalid / incomplete. */
  skippedRows: number;
};

/**
 * Manual column mapping for a feed, expressed as spreadsheet column letters.
 * e.g. { skuCol: "A", titleCol: "B", priceCol: "C" }.
 */
export type FeedColumnMapping = {
  skuCol?: string;
  titleCol?: string;
  priceCol?: string;
};

/**
 * Advanced feed parsing options that override the default header-based mapping.
 */
export type FeedParseOptions = {
  /** Google Sheet tab/gid ID to export (appended to the export URL). */
  sheetGid?: string | null;
  /** Number of header rows to skip before parsing products (default 1). */
  startRow?: number | null;
  /** Manual column definitions (letters) used instead of header search. */
  customMapping?: FeedColumnMapping | null;
  /** Comma-separated negative keywords; rows whose title contains any are skipped. */
  stopWords?: string | null;
  /** Supplier name used to build fallback hash SKUs (e.g. "GRO-8F92A"). */
  supplierName?: string | null;
};

// ─── Errors ─────────────────────────────────────────────────────────────────

/**
 * Error thrown when a feed's columns cannot be reliably mapped to the required
 * logical fields (SKU, name, price). This is a *validation* failure rather than
 * an unexpected runtime error, so callers can surface it as a user-friendly
 * 400 Bad Request instead of a 500 Internal Server Error.
 */
export class FeedMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedMappingError";
    // Maintain proper prototype chain for `instanceof` checks.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Header Mapping ─────────────────────────────────────────────────────────

/**
 * Flexible header aliases for each logical field.
 * Column names are matched case-insensitively, after trimming, and with
 * internal whitespace collapsed so multi-word headers like "Назва товару"
 * match regardless of extra spaces.
 */
const SKU_HEADERS = ["sku", "article", "код", "артикул", "id"];
const NAME_HEADERS = [
  "title",
  "name",
  "назва товару",
  "назва",
  "наименование",
  "товар",
];
const PRICE_HEADERS = ["price", "ціна", "цена", "cost"];

/**
 * Normalise a CSV header for matching:
 *  - Trim leading/trailing whitespace
 *  - Collapse internal runs of whitespace to a single space
 *  - Lowercase (case-insensitive matching)
 */
const normalizeHeader = (header: string): string =>
  header.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Resolve the actual column name for a logical field from the CSV headers.
 * Returns `null` if no matching column is found.
 */
const resolveColumn = (
  headers: string[],
  aliases: string[],
): string | null => {
  const normalizedHeaders = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalizedHeaders.indexOf(alias);
    if (idx !== -1) return headers[idx];
  }
  return null;
};

/**
 * How many rows from the top of the data block to scan when searching for the
 * real header row. Covers feeds that begin with vendor banners, contact info,
 * or a title row before the actual column headers.
 */
const HEADER_SCAN_ROWS = 10;

/**
 * Determine whether a given row looks like a header row.
 *
 * A row is treated as a header when it contains at least one cell that matches
 * a known SKU, name, or price header alias. This lets us skip banner / contact /
 * title rows and locate the actual column header row even when it is not the
 * very first row of the feed.
 */
const isHeaderRow = (row: string[]): boolean => {
  const normalized = row.map(normalizeHeader);
  const allAliases = [...SKU_HEADERS, ...NAME_HEADERS, ...PRICE_HEADERS];
  return normalized.some((cell) => allAliases.includes(cell));
};

/**
 * Resolve the column indices for SKU / name / price from a header row.
 *
 * Returns `null` for any field whose column could not be found.
 */
const resolveIndicesFromHeaders = (
  headers: string[],
): { skuIndex: number; nameIndex: number; priceIndex: number } => {
  const skuColumn = resolveColumn(headers, SKU_HEADERS);
  const nameColumn = resolveColumn(headers, NAME_HEADERS);
  const priceColumn = resolveColumn(headers, PRICE_HEADERS);

  return {
    skuIndex: skuColumn ? headers.indexOf(skuColumn) : -1,
    nameIndex: nameColumn ? headers.indexOf(nameColumn) : -1,
    priceIndex: priceColumn ? headers.indexOf(priceColumn) : -1,
  };
};

/**
 * Locate the actual header row within the first `HEADER_SCAN_ROWS` rows of the
 * data block. Returns the index of the header row, or `null` if none is found.
 */
const findHeaderRowIndex = (rows: string[][]): number | null => {
  const scanLimit = Math.min(rows.length, HEADER_SCAN_ROWS);
  for (let i = 0; i < scanLimit; i++) {
    if (isHeaderRow(rows[i])) return i;
  }
  return null;
};

// ─── Price Normalisation ────────────────────────────────────────────────────

/**
 * Parse a price value into a float.
 *
 * Handles:
 *  - Strings with thousands separators (e.g. "1,234.56" or "1.234,56")
 *  - Comma vs. dot decimal separators (e.g. "12,50" → 12.5)
 *  - Currency symbols / whitespace (e.g. "€ 12.50", "12.50 грн")
 *  - Already-numeric values
 *
 * Returns `null` if the value cannot be parsed as a valid non-negative number.
 */
export const parsePrice = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  const raw = String(value).trim();
  if (raw === "") return null;

  // Strip currency symbols, letters, and whitespace (keep digits, separators, minus).
  const cleaned = raw
    .replace(/[^\d.,\-]/g, "")
    .replace(/\s/g, "");

  if (cleaned === "" || cleaned === "-") return null;

  // Determine the decimal separator.
  // - If both '.' and ',' are present, the last one is the decimal separator.
  // - Otherwise, if only ',' is present and it's followed by exactly 1-2 digits,
  //   treat it as a decimal separator (European style). Otherwise it's a thousands sep.
  let normalized: string;
  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");

  if (hasDot && hasComma) {
    const lastDot = cleaned.lastIndexOf(".");
    const lastComma = cleaned.lastIndexOf(",");
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "").replace(".", ".");
    }
  } else if (hasComma && !hasDot) {
    const parts = cleaned.split(",");
    const decimalPart = parts[parts.length - 1];
    if (decimalPart.length >= 1 && decimalPart.length <= 2) {
      normalized = cleaned.replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else {
    normalized = cleaned;
  }

  const parsed = Number(normalized);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

// ─── Google Sheets URL Conversion ───────────────────────────────────────────

/**
 * Convert a Google Sheets edit/view URL into a direct CSV export URL.
 *
 * Accepts URLs of the form:
 *   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit#gid=0
 *   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/view
 *   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/export?format=csv
 *
 * Returns the canonical CSV export URL:
 *   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/export?format=csv
 *
 * Returns `null` if the URL is not a valid Google Sheets URL.
 */
export const toGoogleSheetsCsvUrl = (
  url: string,
  sheetGid?: string | null,
): string | null => {
  const trimmed = url.trim();

  // Match /spreadsheets/d/{id} optionally followed by /edit, /view, /export, etc.
  const match = trimmed.match(
    /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
  );
  if (!match) return null;

  const spreadsheetId = match[1];

  // Append the specific tab/gid when provided so the export targets that tab.
  const gidParam = sheetGid && sheetGid.trim() !== ""
    ? `&gid=${encodeURIComponent(sheetGid.trim())}`
    : "";

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${gidParam}`;
};

/**
 * Resolve the final download URL for a feed based on its type.
 * Google Sheets URLs are converted to CSV export URLs; CSV URLs are used as-is.
 * When a `sheetGid` is provided for a Google Sheets feed, it is appended to the
 * export URL to target a specific tab.
 */
export const resolveFeedUrl = (
  feedUrl: string,
  feedType: FeedType,
  sheetGid?: string | null,
): string => {
  const trimmed = feedUrl.trim();

  if (feedType === "GOOGLE_SHEETS") {
    const csvUrl = toGoogleSheetsCsvUrl(trimmed, sheetGid);
    if (csvUrl) return csvUrl;
  }

  return trimmed;
};

// ─── Multi-Tab / Multi-Sheet Support ────────────────────────────────────────

/**
 * Extract the spreadsheet ID from a Google Sheets URL.
 * Returns `null` if the URL is not a valid Google Sheets URL.
 */
const extractSpreadsheetId = (url: string): string | null => {
  const match = url.trim().match(
    /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
  );
  return match ? match[1] : null;
};

/**
 * Fetch the HTML view page of a Google Sheet and scrape the `gid` identifiers
 * of every tab/sheet it contains.
 *
 * Google Sheets exposes the list of tabs in the `htmlview` page as links of the
 * form `#gid=123456789`. We collect every unique `gid` so the caller can export
 * and parse each tab individually.
 *
 * Returns an array of `gid` strings (possibly empty if none could be scraped).
 */
const fetchSheetGids = async (spreadsheetId: string): Promise<string[]> => {
  const htmlUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview`;
  const response = await axios.get<string>(htmlUrl, {
    responseType: "text",
    timeout: 30_000,
    maxRedirects: 5,
    headers: {
      Accept: "text/html,application/xhtml+xml,*/*",
      "User-Agent": "Supplier-Product-Matching-System/1.0",
    },
  });

  if (typeof response.data !== "string") {
    return [];
  }

  const gids = new Set<string>();
  const gidRegex = /[#&]gid=(\d+)/g;
  let match: RegExpExecArray | null;
  while ((match = gidRegex.exec(response.data)) !== null) {
    gids.add(match[1]);
  }

  return Array.from(gids);
};

// ─── CSV Fetching & Parsing ─────────────────────────────────────────────────

/**
 * Download the CSV content from the given URL using axios.
 * Returns the raw CSV text.
 */
export const fetchCsvText = async (url: string): Promise<string> => {
  const response = await axios.get<string>(url, {
    responseType: "text",
    timeout: 30_000,
    maxRedirects: 5,
    headers: {
      Accept: "text/csv,text/plain,*/*",
      "User-Agent": "Supplier-Product-Matching-System/1.0",
    },
  });

  if (typeof response.data !== "string") {
    throw new Error("Feed did not return text/CSV content.");
  }

  return response.data;
};

/**
 * Convert a spreadsheet column letter (e.g. "A", "B", "AA") to a zero-based index.
 * Returns `null` for invalid input.
 */
const columnLetterToIndex = (letter: string): number | null => {
  const value = (letter || "").trim().toUpperCase();
  if (!/^[A-Z]+$/.test(value)) return null;

  let index = 0;
  for (const char of value) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index - 1;
};

/**
 * Parse comma-separated stop words into a trimmed, lowercased array.
 * Empty / whitespace-only entries are dropped.
 */
const parseStopWords = (stopWords?: string | null): string[] => {
  if (!stopWords) return [];
  return stopWords
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w !== "");
};

/**
 * Parse raw CSV text into structured product rows.
 *
 * Supports advanced feed configuration:
 *   - `startRow`: number of header rows to skip before parsing products.
 *   - `customMapping`: manual column letters (e.g. { skuCol: "A", ... }) used
 *     instead of the dynamic header search.
 *   - `stopWords`: comma-separated negative keywords; rows whose title contains
 *     any keyword are skipped.
 *
 * When `customMapping` is not provided, the first non-skipped row is treated as
 * the header row and columns are resolved by flexible header aliases.
 *
 * A row is considered valid if it has a non-empty SKU and a parseable price.
 * The name is optional and defaults to the SKU if missing.
 */
export const parseCsvProducts = (
  csvText: string,
  options?: FeedParseOptions,
): ParseFeedResult => {
  const startRow = options?.startRow ?? 1;
  const customMapping = options?.customMapping ?? null;
  const stopWords = parseStopWords(options?.stopWords);

  // Parse as raw arrays so we can honour startRow and custom column mapping.
  const records = parse(csvText, {
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  }) as string[][];

  if (records.length === 0) {
    return { products: [], skippedRows: 0 };
  }

  // Skip the first `startRow - 1` rows (vendor headers, banners, contact info).
  const dataRows = records.slice(Math.max(0, startRow - 1));

  if (dataRows.length === 0) {
    return { products: [], skippedRows: 0 };
  }

  // ─── Column resolution ────────────────────────────────────────────────────
  let skuIndex: number | null = null;
  let nameIndex: number | null = null;
  let priceIndex: number | null = null;
  // Index (within `dataRows`) of the row that was used as the header row.
  // `null` when a custom mapping or positional fallback was used instead.
  let headerRowIndex: number | null = null;

  if (customMapping) {
    // Manual mapping: convert column letters to indices.
    skuIndex = customMapping.skuCol ? columnLetterToIndex(customMapping.skuCol) : null;
    nameIndex = customMapping.titleCol ? columnLetterToIndex(customMapping.titleCol) : null;
    priceIndex = customMapping.priceCol ? columnLetterToIndex(customMapping.priceCol) : null;
  } else {
    // Dynamic header detection: scan the first few rows for the real header row
    // instead of assuming it is always the very first row. This handles feeds
    // that begin with vendor banners, contact info, or a title row, as well as
    // Google/Excel exports whose first row is generic (e.g. ["A", "B", "", "D"]).
    const headerRowIdx = findHeaderRowIndex(dataRows);

    if (headerRowIdx !== null) {
      const headers = dataRows[headerRowIdx];
      const resolved = resolveIndicesFromHeaders(headers);
      skuIndex = resolved.skuIndex;
      nameIndex = resolved.nameIndex;
      priceIndex = resolved.priceIndex;
      headerRowIndex = headerRowIdx;

      console.log(
        `[feedParser] Detected header row at index ${headerRowIdx}: ${JSON.stringify(headers)}`,
      );
      console.log(
        `[feedParser] Resolved columns → SKU: ${skuIndex >= 0 ? skuIndex : "MISSING"}, ` +
          `Name: ${nameIndex >= 0 ? nameIndex : "none"}, ` +
          `Price: ${priceIndex >= 0 ? priceIndex : "MISSING"}`,
      );
    }

    // Fallback: if no explicit header row was found (or it was incomplete),
    // attempt positional mapping (Column 0 = SKU, Column 1 = Name, Column 2 = Price).
    // This is a best-effort heuristic for feeds with generic/blank headers.
    if (skuIndex === null || skuIndex < 0 || priceIndex === null || priceIndex < 0) {
      const positionalSku = 0;
      const positionalName = 1;
      const positionalPrice = 2;

      // Only apply the positional fallback when the row actually has enough
      // columns to be meaningful (avoid mapping a single-column banner row).
      const firstRow = dataRows[0];
      if (firstRow.length >= 3) {
        console.log(
          `[feedParser] No usable header row found; falling back to positional ` +
            `mapping (SKU=col ${positionalSku}, Name=col ${positionalName}, Price=col ${positionalPrice}).`,
        );
        skuIndex = positionalSku;
        nameIndex = positionalName;
        priceIndex = positionalPrice;
      }
    }
  }

  // A price column is strictly required — without it we cannot build products.
  // A missing SKU column is NOT fatal: a fallback SKU is generated per row from
  // the product title (see the row loop below). Throw a FeedMappingError (a
  // validation error) so callers can surface it as a 400 rather than a 500.
  if (priceIndex === null || priceIndex < 0) {
    const available = customMapping
      ? `customMapping: ${JSON.stringify(customMapping)}`
      : `Available rows: ${JSON.stringify(dataRows.slice(0, HEADER_SCAN_ROWS))}`;
    throw new FeedMappingError(
      `Could not map required columns in feed. ` +
        `Price column: ${priceIndex === null || priceIndex < 0 ? "missing" : "ok"}. ` +
        available,
    );
  }

  // When no SKU column is available, fall back to generating a SKU per row.
  const hasSkuColumn = skuIndex !== null && skuIndex >= 0;
  if (!hasSkuColumn) {
    console.log(
      `[feedParser] No SKU column found; will generate fallback SKUs from product titles.`,
    );
  }

  // Determine which rows are product data:
  //  - Custom mapping → all data rows.
  //  - Header-based mapping → skip the detected header row (and any banner rows
  //    that preceded it).
  //  - Positional fallback → all data rows (no header row to skip).
  const productRows =
    customMapping || headerRowIndex === null
      ? dataRows
      : dataRows.slice(headerRowIndex + 1);

  const products: ParsedFeedProduct[] = [];
  let skippedRows = 0;

  for (const record of productRows) {
    // ─── Skip empty / spacer rows ───────────────────────────────────────────
    // Ignore rows where every cell is empty or whitespace-only.
    const isSpacerRow = record.every(
      (cell) => (cell ?? "").trim() === "",
    );
    if (isSpacerRow) {
      skippedRows++;
      continue;
    }

    const price = parsePrice(record[priceIndex]);
    const name = nameIndex !== null && nameIndex >= 0
      ? (record[nameIndex] ?? "").trim()
      : "";
    const title = name;

    // ─── Skip category banners / subheaders ─────────────────────────────────
    // A row that has a title but no valid price (missing, null, 0, or
    // non-numeric, e.g. "iPad Air M4") is treated as a category divider and is
    // NOT added as a product. This is enforced by requiring `price > 0` below.
    //
    // ─── Require valid price & meaningful title ─────────────────────────────
    // Only save rows where `price > 0` and `title.length > 2`.
    if (title.length <= 2 || price === null || price <= 0) {
      skippedRows++;
      continue;
    }

    // ─── Determine the SKU ──────────────────────────────────────────────────
    // Use the mapped column when present and non-empty; otherwise derive a
    // clean, short SKU via `extractSmartSku` (real MPN from the title, or a
    // short hash fallback — never a long title slug).
    const rawSku = skuIndex !== null && skuIndex >= 0
      ? (record[skuIndex] ?? "").trim()
      : "";
    const sku = extractSmartSku(title, rawSku, options?.supplierName ?? undefined);

    // Stop-word filtering: skip rows whose title contains any negative keyword.
    if (stopWords.length > 0) {
      const lowerTitle = title.toLowerCase();
      const matched = stopWords.some((word) => lowerTitle.includes(word));
      if (matched) {
        skippedRows++;
        continue;
      }
    }

    products.push({
      sku,
      name: title,
      price,
    });
  }

  // Debug logging for the first few mapped rows (avoid flooding the console).
  console.log(
    `[feedParser] Parsed ${products.length} product(s), skipped ${skippedRows} row(s).`,
  );
  if (products.length > 0) {
    console.log(
      `[feedParser] First 3 mapped rows: ${JSON.stringify(products.slice(0, 3))}`,
    );
  }

  return { products, skippedRows };
};

/**
 * High-level helper: fetch a feed (Google Sheets or CSV) and parse it into
 * structured product rows, honouring advanced feed options (gid, startRow,
 * customMapping, stopWords).
 *
 * For Google Sheets feeds without an explicit `sheetGid`, the HTML view page is
 * scraped to discover every tab, and each tab is exported as CSV and parsed.
 * The products from all tabs are combined into a single result.
 */
export const fetchAndParseFeed = async (
  feedUrl: string,
  feedType: FeedType,
  options?: FeedParseOptions,
): Promise<ParseFeedResult> => {
  // ─── Multi-tab Google Sheets handling ─────────────────────────────────────
  if (feedType === "GOOGLE_SHEETS") {
    const spreadsheetId = extractSpreadsheetId(feedUrl);

    // If a specific tab is requested, parse only that tab (existing behaviour).
    if (spreadsheetId && !options?.sheetGid) {
      const gids = await fetchSheetGids(spreadsheetId);

      if (gids.length > 0) {
        console.log(
          `[feedParser] Found ${gids.length} tab(s) in Google Sheet: ${JSON.stringify(gids)}`,
        );

        const combined: ParsedFeedProduct[] = [];
        let totalSkipped = 0;

        for (const gid of gids) {
          const csvUrl = toGoogleSheetsCsvUrl(feedUrl, gid);
          if (!csvUrl) continue;

          try {
            const csvText = await fetchCsvText(csvUrl);
            const result = parseCsvProducts(csvText, options);
            combined.push(...result.products);
            totalSkipped += result.skippedRows;
            console.log(
              `[feedParser] Tab gid=${gid}: parsed ${result.products.length} product(s), ` +
                `skipped ${result.skippedRows} row(s).`,
            );
          } catch (err) {
            // A single unparseable tab should not abort the whole feed. Log and
            // continue with the remaining tabs.
            console.warn(
              `[feedParser] Skipping tab gid=${gid} due to parse error: ` +
                `${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }

        return { products: combined, skippedRows: totalSkipped };
      }

      // No tabs scraped — fall through to the default single-export behaviour.
      console.log(
        `[feedParser] Could not scrape tabs; falling back to default sheet export.`,
      );
    }
  }

  // ─── Default single-feed behaviour ────────────────────────────────────────
  const resolvedUrl = resolveFeedUrl(feedUrl, feedType, options?.sheetGid);
  const csvText = await fetchCsvText(resolvedUrl);
  return parseCsvProducts(csvText, options);
};
