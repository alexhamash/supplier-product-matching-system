import axios from "axios";
import { parse } from "csv-parse/sync";
import type { FeedType } from "@prisma/client";

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
};

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

  if (customMapping) {
    // Manual mapping: convert column letters to indices.
    skuIndex = customMapping.skuCol ? columnLetterToIndex(customMapping.skuCol) : null;
    nameIndex = customMapping.titleCol ? columnLetterToIndex(customMapping.titleCol) : null;
    priceIndex = customMapping.priceCol ? columnLetterToIndex(customMapping.priceCol) : null;
  } else {
    // Header-based mapping: the first data row is the header row.
    const headers = dataRows[0];
    const skuColumn = resolveColumn(headers, SKU_HEADERS);
    const nameColumn = resolveColumn(headers, NAME_HEADERS);
    const priceColumn = resolveColumn(headers, PRICE_HEADERS);

    skuIndex = skuColumn ? headers.indexOf(skuColumn) : -1;
    nameIndex = nameColumn ? headers.indexOf(nameColumn) : -1;
    priceIndex = priceColumn ? headers.indexOf(priceColumn) : -1;

    // Debug logging to help diagnose header-mapping issues.
    console.log(
      `[feedParser] Raw CSV headers: ${JSON.stringify(headers)}`,
    );
    console.log(
      `[feedParser] Resolved columns → SKU: ${skuColumn ?? "MISSING"}, ` +
        `Name: ${nameColumn ?? "none"}, Price: ${priceColumn ?? "MISSING"}`,
    );
  }

  // If we cannot find a SKU or price column, we cannot build products.
  if (skuIndex === null || skuIndex < 0 || priceIndex === null || priceIndex < 0) {
    const available = customMapping
      ? `customMapping: ${JSON.stringify(customMapping)}`
      : `Available headers: ${JSON.stringify(dataRows[0])}`;
    throw new Error(
      `Could not find required columns in feed. ` +
        `SKU column: ${skuIndex === null || skuIndex < 0 ? "missing" : "ok"}, ` +
        `Price column: ${priceIndex === null || priceIndex < 0 ? "missing" : "ok"}. ` +
        available,
    );
  }

  // When using header-based mapping, skip the header row itself.
  const productRows = customMapping ? dataRows : dataRows.slice(1);

  const products: ParsedFeedProduct[] = [];
  let skippedRows = 0;

  for (const record of productRows) {
    const sku = (record[skuIndex] ?? "").trim();
    const price = parsePrice(record[priceIndex]);
    const name = nameIndex !== null && nameIndex >= 0
      ? (record[nameIndex] ?? "").trim()
      : "";

    if (sku === "" || price === null) {
      skippedRows++;
      continue;
    }

    const title = name || sku;

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
 */
export const fetchAndParseFeed = async (
  feedUrl: string,
  feedType: FeedType,
  options?: FeedParseOptions,
): Promise<ParseFeedResult> => {
  const resolvedUrl = resolveFeedUrl(feedUrl, feedType, options?.sheetGid);
  const csvText = await fetchCsvText(resolvedUrl);
  return parseCsvProducts(csvText, options);
};
