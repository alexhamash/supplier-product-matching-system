// src/services/matchingService.ts
//
// Refactored to consume the backend REST API.
//
// Endpoints consumed:
//   POST   /api/matching/run
//   GET    /api/matching
//   PATCH  /api/matching/:id/status

import { apiClient } from './api';
import type {
  MainProduct,
  SupplierProduct,
  MatchResult,
  ApiProductMatch,
  ProductMatch,
  RunMatchingPayload,
  RunMatchingResult,
  RunMatchingAllResult,
  UpdateMatchStatusPayload,
  LinkMatchPayload,
} from '../types';

// ─── Mapping helpers ────────────────────────────────────────────────────────

/**
 * Map an API ProductMatch DTO to the frontend MatchResult shape.
 */
const toMatchResult = (api: ApiProductMatch): MatchResult => ({
  mainProductId: Number(api.mainProductId) || 0,
  supplierProductId: api.supplierProductId,
  supplierId: Number(api.supplierProduct?.supplierId) || 0,
  confidence: api.confidenceScore ?? 0,
  matchedAt: api.createdAt,
});

const toMatchResults = (list: ApiProductMatch[]): MatchResult[] =>
  list.map(toMatchResult);

/**
 * Map an API ProductMatch DTO to the enriched ProductMatch shape used by the
 * matching table (includes supplier + main product names, SKUs and prices).
 */
const toProductMatch = (api: ApiProductMatch): ProductMatch => ({
  id: api.id,
  status: api.status,
  confidenceScore: api.confidenceScore,
  createdAt: api.createdAt,
  updatedAt: api.updatedAt,
  mainProduct: {
    id: api.mainProduct?.id ?? api.mainProductId,
    sku: api.mainProduct?.sku ?? '',
    name: api.mainProduct?.name ?? '',
    price: api.mainProduct?.price ?? 0,
  },
  supplierProduct: {
    id: api.supplierProduct?.id ?? api.supplierProductId,
    rawSku: api.supplierProduct?.rawSku ?? '',
    rawName: api.supplierProduct?.rawName ?? '',
    price: api.supplierProduct?.price ?? 0,
    supplierId: api.supplierProduct?.supplierId ?? '',
    supplier: api.supplierProduct?.supplier,
  },
});

const toProductMatches = (list: ApiProductMatch[]): ProductMatch[] =>
  list.map(toProductMatch);

// ─── Matching Engine ────────────────────────────────────────────────────────

/**
 * POST /api/matching/run
 * Trigger the matching engine for a given supplier (or all suppliers when
 * `supplierId` is omitted).
 *
 * @param payload - Object containing an optional supplierId and optional
 *                  confidenceThreshold.
 * @returns The raw API response data (per-supplier result or aggregate result).
 */
export const runMatching = async (
  payload: RunMatchingPayload = {},
): Promise<RunMatchingResult | RunMatchingAllResult> => {
  const data = await apiClient.post<RunMatchingResult | RunMatchingAllResult>(
    'matching/run',
    payload,
  );
  return data;
};

// ─── Fetch Matches ──────────────────────────────────────────────────────────

/**
 * GET /api/matching
 * Fetch generated matches with optional status / supplier filters.
 *
 * @param params - Optional query parameters.
 * @param params.status - Filter by match status ("PENDING" | "APPROVED" | "REJECTED").
 * @param params.supplierId - Filter by supplier UUID.
 * @returns Array of match results mapped to the frontend shape.
 */
export const getMatches = async (
  params?: {
    status?: string;
    supplierId?: string;
  },
): Promise<MatchResult[]> => {
  const data = await apiClient.get<ApiProductMatch[]>(
    'matching',
    params as Record<string, string>,
  );
  return toMatchResults(data);
};

/**
 * GET /api/matching
 * Fetch generated matches enriched with supplier + main product details.
 *
 * @param params - Optional query parameters.
 * @param params.status - Filter by match status ("PENDING" | "APPROVED" | "REJECTED").
 * @param params.supplierId - Filter by supplier UUID.
 * @returns Array of enriched ProductMatch records for the matching table.
 */
export const getProductMatches = async (
  params?: {
    status?: string;
    supplierId?: string;
  },
): Promise<ProductMatch[]> => {
  const data = await apiClient.get<ApiProductMatch[]>(
    'matching',
    params as Record<string, string>,
  );
  return toProductMatches(data);
};

// ─── Update Match Status ────────────────────────────────────────────────────

/**
 * PATCH /api/matching/:id/status
 * Approve or reject a match.
 *
 * @param id - The backend UUID of the ProductMatch record.
 * @param payload - Object with status ("APPROVED" | "REJECTED").
 * @returns The updated match mapped to the frontend shape.
 */
export const updateMatchStatus = async (
  id: string,
  payload: UpdateMatchStatusPayload,
): Promise<ProductMatch> => {
  const data = await apiClient.patch<ApiProductMatch>(
    `matching/${id}/status`,
    payload,
  );
  return toProductMatch(data);
};

// ─── Direct Link ────────────────────────────────────────────────────────────

/**
 * POST /api/matching/link
 * Directly link a specific supplier product to a specific main product by
 * creating (or updating) an APPROVED ProductMatch for that exact pair.
 *
 * @param payload - Object with supplierProductId and mainProductId.
 * @returns The linked match enriched with supplier + main product details.
 */
export const linkMatch = async (
  payload: LinkMatchPayload,
): Promise<ProductMatch> => {
  const data = await apiClient.post<ApiProductMatch>('matching/link', payload);
  return toProductMatch(data);
};

/**
 * POST /api/matching/unlink
 * Remove an existing link between a supplier product and a main product.
 *
 * @param payload - Object with supplierProductId and mainProductId.
 */
export const unlinkMatch = async (
  payload: LinkMatchPayload,
): Promise<void> => {
  await apiClient.post<{ success: boolean }>('matching/unlink', payload);
};

// ─── Local Scoring (kept for UI suggestions) ────────────────────────────────

/**
 * Calculate a similarity score (0-100) between two product names.
 *
 * Tokenises both inputs, lowercases them, strips non-alphanumeric characters,
 * and computes the ratio of common tokens to the longer token set.
 *
 * This function remains client-side because it powers the real-time suggestion
 * UI without requiring a network round-trip for every keystroke.
 */
export const calculateScore = (name1: string, name2: string): number => {
  const prepare = (s: string): string[] =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9а-яіїє]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

  const t1 = prepare(name1);
  const t2 = prepare(name2);

  if (!t1.length || !t2.length) return 0;

  const common = t1.filter((t) => t2.includes(t));
  return Math.round((common.length / Math.max(t1.length, t2.length)) * 100);
};

/**
 * Given a selected main product and a list of supplier products, return
 * supplier products scored by name similarity, filtered by a minimum
 * confidence threshold (5%), and sorted descending by confidence.
 *
 * This remains client-side for real-time UI suggestions.
 */
export const getSupplierSuggestions = (
  selectedProduct: MainProduct,
  allSuppliers: SupplierProduct[],
): (SupplierProduct & { confidence: number })[] => {
  if (!selectedProduct) return [];

  return allSuppliers
    .map((sp) => ({
      ...sp,
      confidence: calculateScore(selectedProduct.name, sp.name),
    }))
    .filter((item) => item.confidence > 5)
    .sort((a, b) => b.confidence - a.confidence);
};

// ─── Legacy / Compatibility ─────────────────────────────────────────────────

/**
 * Legacy function that persisted a match to LocalStorage.
 *
 * **Deprecated:** Use `updateMatchStatus` instead.
 *
 * @deprecated
 */
export const createMatch = (
  _mainProductId: number,
  _supplierProductId: number | string,
  _supplierId: number,
): SupplierProduct[] => {
  console.warn(
    '[matchingService] createMatch is deprecated. Use updateMatchStatus instead.',
  );
  return [];
};
