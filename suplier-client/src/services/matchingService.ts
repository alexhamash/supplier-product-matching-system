// src/services/matchingService.ts

import type { MainProduct, SupplierProduct, MatchResult } from '../types';

/**
 * Calculate a similarity score (0-100) between two product names.
 *
 * Tokenises both inputs, lowercases them, strips non-alphanumeric characters,
 * and computes the ratio of common tokens to the longer token set.
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

/**
 * Persist a match between a main product and a supplier product in LocalStorage.
 *
 * Updates the supplier product's status to "matched" and assigns the
 * mainProductId. Data is stored under the key `supplier_products_{supplierId}`.
 *
 * @returns The updated list of supplier products for that supplier.
 */
export const createMatch = (
  mainProductId: number,
  supplierProductId: number | string,
  supplierId: number,
): SupplierProduct[] => {
  const key = `supplier_products_${supplierId}`;
  const products: SupplierProduct[] = JSON.parse(
    localStorage.getItem(key) || '[]',
  );

  const updatedProducts: SupplierProduct[] = products.map((p) => {
    if (p.id === supplierProductId) {
      return { ...p, status: 'matched', mainProductId };
    }
    return p;
  });

  localStorage.setItem(key, JSON.stringify(updatedProducts));

  return updatedProducts;
};
