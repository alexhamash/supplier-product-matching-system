// src/services/supplierService.ts
//
// Refactored to consume the backend REST API.
//
// Endpoints consumed:
//   GET    /api/suppliers
//   POST   /api/suppliers
//   DELETE /api/suppliers/:id
//   POST   /api/suppliers/:id/products   (batch import)
//   GET    /api/suppliers/:id/products   (fetch imported products)
//   POST   /api/suppliers/:id/sync       (manual feed sync)
//   PATCH  /api/suppliers/:id/feed-config (update feed settings)

import { apiClient } from './api';
import type {
  Supplier,
  SupplierProduct,
  ApiSupplier,
  ApiSupplierProduct,
  CreateSupplierPayload,
  CreateSupplierResponse,
  CreateSupplierResult,
  ImportSupplierProductsPayload,
  ImportSupplierProductsResponse,
  UpdateFeedConfigPayload,
  SyncSupplierResponse,
} from '../types';

// ─── Mapping helpers ────────────────────────────────────────────────────────

/**
 * Map an API supplier DTO to the frontend Supplier shape.
 *
 * The backend returns `id`, `name`, `contactInfo`, `productsCount`, `createdAt`,
 * `updatedAt`. The frontend additionally expects `sheetUrl`, `status`, `lastSync`
 * which we derive with sensible defaults.
 */
const toSupplier = (api: ApiSupplier): Supplier => ({
  id: api.id,
  name: api.name,
  sheetUrl: api.contactInfo ?? '',
  productsCount: api.productsCount,
  status: 'Active',
  lastSync: api.updatedAt ?? null,
  feedType: api.feedType ?? 'CSV',
  autoSync: api.autoSync ?? false,
  lastSyncedAt: api.lastSyncedAt ?? null,
  sheetGid: api.sheetGid ?? null,
  startRow: api.startRow ?? 1,
  customMapping: api.customMapping ?? null,
  stopWords: api.stopWords ?? null,
});

const toSuppliers = (list: ApiSupplier[]): Supplier[] =>
  list.map(toSupplier);

/**
 * Map an API supplier-product DTO to the frontend SupplierProduct shape.
 */
const toSupplierProduct = (api: ApiSupplierProduct): SupplierProduct => ({
  id: api.id,
  name: api.rawName,
  price: api.price,
  status: api.isMatched ? 'matched' : 'unmatched',
  supplierSku: api.rawSku,
  supplierId: api.supplierId || undefined,
  matchedMainProductId: api.matchedMainProductId ?? null,
  isMatched: api.isMatched ?? Boolean(api.matchedMainProductId),
  linkedMainProduct: api.linkedMainProduct ?? null,
});

const toSupplierProducts = (list: ApiSupplierProduct[]): SupplierProduct[] =>
  list.map(toSupplierProduct);

// ─── CRUD Operations ────────────────────────────────────────────────────────

/**
 * GET /api/suppliers
 * Retrieve all suppliers from the backend.
 */
export const getSuppliers = async (): Promise<Supplier[]> => {
  const data = await apiClient.get<ApiSupplier[]>('suppliers');
  return toSuppliers(data);
};

/**
 * POST /api/suppliers
 * Create a new supplier on the backend.
 *
 * The backend creates the supplier AND triggers the initial feed sync
 * synchronously, so the response includes the created supplier plus the number
 * of products imported during onboarding.
 *
 * @param payload - Supplier data (name, contactInfo?).
 * @returns The created supplier (mapped to the frontend shape) and the count
 *          of products imported during the initial sync.
 */
export const createSupplier = async (
  payload: CreateSupplierPayload,
): Promise<CreateSupplierResult> => {
  const data = await apiClient.post<CreateSupplierResponse>('suppliers', payload);
  return {
    supplier: toSupplier(data.supplier),
    importedCount: data.importedCount,
  };
};

/**
 * POST /api/suppliers/:id/sync
 * Trigger an immediate manual sync for a specific supplier.
 *
 * @param supplierId - The backend UUID of the supplier.
 * @returns The ingestion result summary.
 */
export const syncSupplier = async (
  supplierId: string,
): Promise<SyncSupplierResponse> => {
  return apiClient.post<SyncSupplierResponse>(`suppliers/${supplierId}/sync`);
};

/**
 * PATCH /api/suppliers/:id/feed-config
 * Update the feed configuration (feedUrl / feedType / autoSync) for a supplier.
 *
 * @param supplierId - The backend UUID of the supplier.
 * @param payload - Feed settings to update.
 * @returns The updated supplier mapped to the frontend shape.
 */
export const updateSupplierFeedConfig = async (
  supplierId: string,
  payload: UpdateFeedConfigPayload,
): Promise<Supplier> => {
  const data = await apiClient.patch<ApiSupplier>(
    `suppliers/${supplierId}/feed-config`,
    payload,
  );
  return toSupplier(data);
};

/**
 * DELETE /api/suppliers/:id
 * Delete a supplier by its backend UUID.
 */
export const deleteSupplier = async (id: string): Promise<void> => {
  await apiClient.del(`suppliers/${id}`);
};

// ─── Supplier Products ──────────────────────────────────────────────────────

/**
 * GET /api/suppliers/:id/products
 * Fetch all imported products for a specific supplier.
 *
 * @param supplierId - The backend UUID of the supplier.
 */
export const getSupplierProducts = async (
  supplierId: string,
): Promise<SupplierProduct[]> => {
  const data = await apiClient.get<ApiSupplierProduct[]>(
    `suppliers/${supplierId}/products`,
  );
  return toSupplierProducts(data);
};

/**
 * Fetch supplier products for ALL suppliers and aggregate them into a single
 * list. Each product is tagged with its owning supplier's id.
 *
 * @param suppliers - The list of suppliers to fetch products for.
 * @returns A flat array of all supplier products across every supplier.
 */
export const getAllSupplierProducts = async (
  suppliers: Supplier[],
): Promise<SupplierProduct[]> => {
  const results = await Promise.all(
    suppliers.map(async (supplier) => {
      try {
        const products = await getSupplierProducts(supplier.id);
        // Ensure each product carries its owning supplier's id (a UUID string).
        return products.map((p) => ({
          ...p,
          supplierId: supplier.id,
        }));
      } catch (err) {
        console.error(
          `Failed to load products for supplier '${supplier.name}':`,
          err,
        );
        return [];
      }
    }),
  );

  return results.flat();
};

/**
 * POST /api/suppliers/:id/products
 * Import / ingest a batch of raw products for a specific supplier.
 *
 * @param supplierId - The backend UUID of the supplier.
 * @param payload - Object containing an array of products with rawSku, rawName, price.
 * @returns Import summary (counts of imported / skipped).
 */
export const importSupplierProducts = async (
  supplierId: string,
  payload: ImportSupplierProductsPayload,
): Promise<ImportSupplierProductsResponse> => {
  const data = await apiClient.post<ImportSupplierProductsResponse>(
    `suppliers/${supplierId}/products`,
    payload,
  );
  return data;
};

// ─── Legacy / Compatibility ─────────────────────────────────────────────────

/**
 * Legacy wrapper that simulates importing supplier data.
 *
 * **Deprecated:** Use `importSupplierProducts` instead.
 * This function is kept for backward compatibility with existing pages that
 * call `importSupplierData(supplierId)` and expect a Promise<ImportResponse>.
 *
 * @deprecated Will be removed once all pages migrate to the new API.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export const importSupplierData = (
  _supplierId: number,
): Promise<{ count: number; products: SupplierProduct[] }> => {
  console.warn(
    '[supplierService] importSupplierData is deprecated. Use importSupplierProducts instead.',
  );
  return Promise.resolve({ count: 0, products: [] });
};
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Legacy in-memory link function.
 *
 * **Deprecated:** Use the matching service endpoints instead.
 *
 * @deprecated
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export const linkProduct = (
  _supplierProductId: number | string,
  _mainProductId: number,
): { success: boolean } => {
  console.warn(
    '[supplierService] linkProduct is deprecated. Use matchingService instead.',
  );
  return { success: false };
};
/* eslint-enable @typescript-eslint/no-unused-vars */
