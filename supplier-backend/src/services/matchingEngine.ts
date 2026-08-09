import { prisma } from "../lib/prisma";

// ─── Types ──────────────────────────────────────────────────────────────────

export type MatchCandidate = {
  supplierProductId: string;
  mainProductId: string;
  confidenceScore: number;
};

export type MatchResult = {
  supplierId: string;
  totalSupplierProducts: number;
  matchesCreated: number;
  matchesSkipped: number;
};

// ─── Text Normalisation ─────────────────────────────────────────────────────

/**
 * Normalise a string for fuzzy comparison:
 * - Lowercase
 * - Replace hyphens, underscores, and multiple spaces with a single space
 * - Trim leading/trailing whitespace
 * - Remove common filler words (e.g., "the", "a", "an", "and", "or", "of", "for")
 */
const normalise = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b(the|a|an|and|or|of|for|in|on|at|to|with|by)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// ─── Similarity Scoring ─────────────────────────────────────────────────────

/**
 * Compute the Levenshtein (edit) distance between two strings.
 */
const levenshteinDistance = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;

  // Use two-row optimisation for O(n) memory
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);

  for (let j = 0; j <= n; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1, // insertion
        prev[j] + 1, // deletion
        prev[j - 1] + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
};

/**
 * Compute a normalised similarity score (0.0 – 1.0) between two strings
 * using Levenshtein distance.
 *
 * 1.0 = identical (after normalisation)
 * 0.0 = completely different
 */
const stringSimilarity = (a: string, b: string): number => {
  const normA = normalise(a);
  const normB = normalise(b);

  if (normA === normB) return 1.0;
  if (normA.length === 0 || normB.length === 0) return 0.0;

  const distance = levenshteinDistance(normA, normB);
  const maxLen = Math.max(normA.length, normB.length);

  return 1.0 - distance / maxLen;
};

// ─── Confidence Calculation ─────────────────────────────────────────────────

type ConfidenceInput = {
  /** Similarity score between rawName and main product name (0–1) */
  nameScore: number;
  /** Similarity score between rawSku and main product SKU (0–1) */
  skuScore: number;
  /** Whether the prices are within a 20% tolerance */
  priceCompatible: boolean;
};

/**
 * Calculate a final confidence score (0.0 – 1.0) from the individual signals.
 *
 * Weighting:
 *   - SKU match: 40 %
 *   - Name match: 40 %
 *   - Price compatibility: 20 %
 */
const calculateConfidence = (input: ConfidenceInput): number => {
  const rawScore =
    input.skuScore * 0.4 + input.nameScore * 0.4 + (input.priceCompatible ? 0.2 : 0.0);

  // Clamp to [0, 1]
  return Math.min(1.0, Math.max(0.0, rawScore));
};

// ─── Main Matching Algorithm ────────────────────────────────────────────────

/**
 * Run the matching engine for a given supplier.
 *
 * For each `SupplierProduct` belonging to the supplier, the engine:
 * 1. Compares `rawSku` against every `MainProduct.sku` (exact + fuzzy).
 * 2. Compares `rawName` against every `MainProduct.name` (fuzzy).
 * 3. Checks price compatibility (within 20 % tolerance).
 * 4. Computes a confidence score.
 * 5. If confidence >= threshold (0.5), creates/updates a `ProductMatch` record.
 *
 * Only the **best** match per supplier product is kept (highest confidence).
 */
export const runMatchingForSupplier = async (
  supplierId: string,
  options?: { confidenceThreshold?: number },
): Promise<MatchResult> => {
  const threshold = options?.confidenceThreshold ?? 0.5;

  // Fetch all supplier products for this supplier
  const supplierProducts = await prisma.supplierProduct.findMany({
    where: { supplierId },
  });

  // Fetch all main products for the catalog
  const mainProducts = await prisma.mainProduct.findMany();

  if (supplierProducts.length === 0 || mainProducts.length === 0) {
    return {
      supplierId,
      totalSupplierProducts: supplierProducts.length,
      matchesCreated: 0,
      matchesSkipped: 0,
    };
  }

  // Build a lookup of existing matches to avoid re-creating them
  const existingMatches = await prisma.productMatch.findMany({
    where: {
      supplierProduct: { supplierId },
    },
    select: {
      supplierProductId: true,
      mainProductId: true,
    },
  });
  const existingMatchSet = new Set(
    existingMatches.map((m) => `${m.supplierProductId}:${m.mainProductId}`),
  );

  const candidates: MatchCandidate[] = [];

  for (const sp of supplierProducts) {
    let bestCandidate: MatchCandidate | null = null;

    for (const mp of mainProducts) {
      // Skip if this exact pair already exists
      if (existingMatchSet.has(`${sp.id}:${mp.id}`)) {
        continue;
      }

      // Compute individual similarity scores
      const skuScore = stringSimilarity(sp.rawSku, mp.sku);
      const nameScore = stringSimilarity(sp.rawName, mp.name);

      // Price compatibility: within 20 % tolerance
      const priceDiff = Math.abs(sp.price - mp.price);
      const maxPrice = Math.max(sp.price, mp.price);
      const priceCompatible = maxPrice > 0 ? priceDiff / maxPrice <= 0.2 : true;

      const confidence = calculateConfidence({ nameScore, skuScore, priceCompatible });

      if (confidence >= threshold) {
        if (!bestCandidate || confidence > bestCandidate.confidenceScore) {
          bestCandidate = {
            supplierProductId: sp.id,
            mainProductId: mp.id,
            confidenceScore: confidence,
          };
        }
      }
    }

    if (bestCandidate) {
      candidates.push(bestCandidate);
    }
  }

  // Bulk-create the candidate matches inside a transaction
  let matchesCreated = 0;
  let matchesSkipped = 0;

  if (candidates.length > 0) {
    // Deduplicate by (supplierProductId, mainProductId) — though our loop
    // already picks the best per supplier product, there could be edge cases.
    const seen = new Set<string>();
    const uniqueCandidates = candidates.filter((c) => {
      const key = `${c.supplierProductId}:${c.mainProductId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const result = await prisma.$transaction(async (tx) => {
      let created = 0;
      for (const candidate of uniqueCandidates) {
        await tx.productMatch.create({
          data: {
            supplierProductId: candidate.supplierProductId,
            mainProductId: candidate.mainProductId,
            status: "PENDING",
            confidenceScore: candidate.confidenceScore,
          },
        });
        created++;
      }
      return { created };
    });

    matchesCreated = result.created;
    matchesSkipped = candidates.length - matchesCreated;
  }

  return {
    supplierId,
    totalSupplierProducts: supplierProducts.length,
    matchesCreated,
    matchesSkipped,
  };
};
