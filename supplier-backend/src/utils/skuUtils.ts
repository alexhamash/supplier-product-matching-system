// ─── Smart SKU / MPN Extraction Utilities ────────────────────────────────────

/**
 * Derive a clean, short supplier SKU from a product title.
 *
 * Strategy (in priority order):
 *   1. Use a provided `rawSku` when it is short (< 20 chars) and does not look
 *      like a slugified title (e.g. "galaxy-s25-12-512gb-silver-shadow").
 *   2. Otherwise, extract a real manufacturer part number (MPN) from the title
 *      using common patterns (Apple, Samsung, generic hyphenated codes).
 *   3. Otherwise, fall back to a short deterministic hash prefixed by the
 *      supplier name, e.g. `GRO-8F92A`.
 *
 * This prevents long, hyphenated title slugs (e.g.
 * `GALAXY-S25-12-512GB-SILVER-SHADOW...`) from being stored as SKUs.
 */

// ─── Raw SKU validation ──────────────────────────────────────────────────────

/**
 * A "raw slug" is a slugified product title — typically long and full of
 * hyphens (e.g. "galaxy-s25-12-512gb-silver-shadow"). We only trust a raw SKU
 * when it is short and does not look like such a slug.
 */
const RAW_SLUG_LIKE = /[-\s]/;

/**
 * Decide whether a provided raw SKU is clean enough to use directly.
 * It must be non-empty, short (< 20 chars), and free of slug-like separators.
 */
const isCleanRawSku = (rawSku: string): boolean => {
  const trimmed = rawSku.trim();
  if (trimmed === "") return false;
  if (trimmed.length >= 20) return false;
  // Reject values that look like slugified titles (contain hyphens/spaces).
  if (RAW_SLUG_LIKE.test(trimmed)) return false;
  return true;
};

// ─── MPN extraction ──────────────────────────────────────────────────────────

/**
 * Apple MPN pattern — matches codes like `MQDP3`, `MWR53`, `MJQK3`, `MDFV4`.
 * Apple part numbers are 5-7 uppercase alphanumerics that START with a letter
 * and contain at least one digit. Requiring a leading letter distinguishes them
 * from storage sizes (e.g. `512GB`, `256GB`) and numeric codes (e.g. `03407`).
 */
const APPLE_MPN_REGEX = /\b(?=[A-Z][A-Z0-9]{4,6}\b)[A-Z0-9]*[0-9][A-Z0-9]*\b/g;

/**
 * Apple MPN pattern restricted to codes wrapped in parentheses, e.g. `(MQDP3)`.
 * Used first because bracketed codes are unambiguous MPNs (unlike standalone
 * tokens, which could also be storage sizes like `128GB`).
 */
const APPLE_MPN_BRACKETED_REGEX = /\(([A-Z0-9]{5,7})\)/g;

/**
 * Samsung MPN pattern — matches codes like `SM-S931BZSH`, `SM-A546B`.
 * Samsung model codes start with `SM-` followed by 1-2 letters and digits.
 */
const SAMSUNG_MPN_REGEX = /\bSM-[A-Z0-9]{4,10}\b/g;

/**
 * Generic MPN pattern — matches uppercase alphanumeric strings with hyphens,
 * length 6-15 (e.g. `010-03407-...`).
 */
const GENERIC_MPN_REGEX = /\b[A-Z0-9]{2,5}-[A-Z0-9-]{3,12}\b/g;

/**
 * Extract a manufacturer part number (MPN) from a product title.
 *
 * Tries bracketed Apple codes, then Samsung codes, then standalone Apple codes,
 * then generic hyphenated patterns. Samsung is checked before standalone Apple
 * so full Samsung codes (e.g. `SM-A546B`) are captured before the Apple pattern
 * could grab a substring. Returns the first match found (trimmed), or `null`
 * when no pattern matches.
 */
export const extractMpn = (title: string): string | null => {
  if (!title) return null;

  // Bracketed Apple codes are unambiguous MPNs — prefer them first.
  const bracketed = title.match(APPLE_MPN_BRACKETED_REGEX);
  if (bracketed && bracketed.length > 0) {
    return bracketed[0].replace(/[()]/g, "");
  }

  // Samsung codes (e.g. "SM-S931BZSH", "SM-A546B").
  const samsungMatch = title.match(SAMSUNG_MPN_REGEX);
  if (samsungMatch && samsungMatch.length > 0) {
    return samsungMatch[0];
  }

  // Standalone Apple codes (e.g. "Apple Watch MWR53 45mm").
  const appleMatch = title.match(APPLE_MPN_REGEX);
  if (appleMatch && appleMatch.length > 0) {
    return appleMatch[0];
  }

  const genericMatch = title.match(GENERIC_MPN_REGEX);
  if (genericMatch && genericMatch.length > 0) {
    return genericMatch[0];
  }

  return null;
};

// ─── Fallback hash SKU ───────────────────────────────────────────────────────

/**
 * Derive a short, deterministic supplier prefix from a supplier name.
 * Uppercases and keeps only the first `length` alphanumeric characters
 * (default 3). Falls back to "SUP" when the name yields no usable characters.
 */
export const supplierPrefix = (supplierName?: string, length = 3): string => {
  const cleaned = (supplierName ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return cleaned.slice(0, length) || "SUP";
};

/**
 * Generate a short, deterministic hash (uppercase alphanumeric) from a string.
 * Uses a simple FNV-1a-style hash to keep the output stable across runs while
 * remaining dependency-free.
 */
const shortHash = (value: string, length = 5): string => {
  const input = value || "sku";
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  // Convert to a base-36 uppercase string and pad to the desired length.
  const base36 = (hash >>> 0).toString(36).toUpperCase();
  return base36.padStart(length, "0").slice(0, length);
};

// ─── Main entry point ────────────────────────────────────────────────────────

/**
 * Compute a clean, short SKU for a supplier product.
 *
 * @param title        The product title/name (used for MPN extraction & hash).
 * @param rawSku       An optional explicit SKU provided by the supplier.
 * @param supplierName Optional supplier name used to build the fallback prefix.
 * @param prefixLength Number of characters to keep from the fallback prefix
 *                     (default 3, e.g. "MAI" from "MAIN"). Pass 4 to get "MAIN".
 * @returns A clean, short SKU string.
 */
export const extractSmartSku = (
  title: string,
  rawSku?: string,
  supplierName?: string,
  prefixLength = 3,
): string => {
  // 1. Trust a clean, short raw SKU when provided.
  if (rawSku && isCleanRawSku(rawSku)) {
    return rawSku.trim();
  }

  // 2. Extract a real MPN from the title.
  const mpn = extractMpn(title);
  if (mpn) {
    return mpn;
  }

  // 3. Fall back to a short hash SKU (never a long title slug).
  const prefix = supplierPrefix(supplierName, prefixLength);
  const hash = shortHash(title);
  return `${prefix}-${hash}`;
};
