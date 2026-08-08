// src/services/mainProductService.ts
//
// Refactored to consume the backend REST API at /api/main-products.
// All CRUD operations now call the live endpoints instead of LocalStorage.

import { apiClient } from './api';
import type {
  MainProduct,
  ApiMainProduct,
  CreateMainProductPayload,
  UpdateMainProductPayload,
  SupplierMatrix,
} from '../types';

// ─── Mapping helpers ────────────────────────────────────────────────────────

/**
 * Map an API main-product DTO to the frontend MainProduct shape.
 *
 * The backend stores `sku`, `name`, `description`, `price` while the frontend
 * also expects `brand`, `category`, `linkedCount`. We derive sensible defaults
 * for fields the API does not yet provide.
 */
const toMainProduct = (api: ApiMainProduct): MainProduct => ({
  // Preserve the backend's real string UUID. Converting it to a number would
  // yield NaN (UUIDs are non-numeric) and fall back to a client-generated
  // timestamp that does NOT exist in the database, causing 404s on linking.
  id: api.id,
  name: api.name,
  SKU: api.sku,
  brand: '',
  category: api.description ?? undefined,
  linkedCount: 0,
});

/**
 * Map an array of API DTOs to frontend MainProduct[]. Sorted by createdAt desc.
 */
const toMainProducts = (list: ApiMainProduct[]): MainProduct[] =>
  list.map(toMainProduct);

// ─── CRUD Operations ────────────────────────────────────────────────────────

/**
 * GET /api/main-products
 * Retrieve all main products from the backend.
 */
export const getMainProducts = async (): Promise<MainProduct[]> => {
  const data = await apiClient.get<ApiMainProduct[]>('main-products');
  return toMainProducts(data);
};

/**
 * POST /api/main-products
 * Create a new main product on the backend.
 *
 * @param payload - Product data (sku, name, description?, price).
 * @returns The created product mapped to the frontend shape.
 */
export const createMainProduct = async (
  payload: CreateMainProductPayload,
): Promise<MainProduct> => {
  const data = await apiClient.post<ApiMainProduct>('main-products', payload);
  return toMainProduct(data);
};

/**
 * PUT /api/main-products/:id
 * Update an existing main product.
 *
 * @param id - The backend UUID of the product.
 * @param payload - Fields to update.
 * @returns The updated product mapped to the frontend shape.
 */
export const updateMainProduct = async (
  id: string,
  payload: UpdateMainProductPayload,
): Promise<MainProduct> => {
  const data = await apiClient.put<ApiMainProduct>(
    `main-products/${id}`,
    payload,
  );
  return toMainProduct(data);
};

/**
 * DELETE /api/main-products/:id
 * Delete a main product by its backend UUID.
 */
export const deleteMainProduct = async (id: string): Promise<void> => {
  await apiClient.del(`main-products/${id}`);
};

/**
 * GET /api/main-products/:id/matrix
 * Retrieve the consolidated Supplier Matrix for a single main product.
 *
 * @param id - The backend UUID of the main product.
 * @returns The matrix payload (main product info, summary stats, and offers).
 */
export const getMainProductMatrix = async (
  id: string,
): Promise<SupplierMatrix> => {
  return apiClient.get<SupplierMatrix>(`main-products/${id}/matrix`);
};
