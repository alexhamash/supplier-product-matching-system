// src/services/mainProductService.ts

import type { MainProduct } from '../types';

const STORAGE_KEY = 'main_products';

const defaultProducts: MainProduct[] = [
  { id: 1, name: 'Apple iPhone 15 128GB Black', SKU: 'IPH15-128-BK', brand: 'Apple', category: 'Smartphones', linkedCount: 0 },
  { id: 2, name: 'Samsung Galaxy S24 Ultra 12/256GB', SKU: 'SM-S928B', brand: 'Samsung', category: 'Smartphones', linkedCount: 0 },
  { id: 3, name: 'Sony PlayStation 5 Slim Edition', SKU: 'PS5-SLIM-WH', brand: 'Sony', category: 'Consoles', linkedCount: 0 },
  { id: 4, name: 'MacBook Air M3 13.6" 8/256GB Silver', SKU: 'MAC-M3-13-SL', brand: 'Apple', category: 'Laptops', linkedCount: 0 },
  { id: 5, name: 'Logitech G Pro X Superlight White', SKU: 'LOGI-GPX-WH', brand: 'Logitech', category: 'Accessories', linkedCount: 0 },
  { id: 6, name: 'Asus ROG Zephyrus G14 2024', SKU: 'ASUS-G14-2024', brand: 'Asus', category: 'Laptops', linkedCount: 0 },
  { id: 7, name: 'AirPods Pro (2nd Gen) MagSafe USB-C', SKU: 'MQD83', brand: 'Apple', category: 'Audio', linkedCount: 0 },
];

/**
 * Retrieve all main products from LocalStorage, falling back to defaults.
 */
export const getMainProducts = (): MainProduct[] => {
  const savedData = localStorage.getItem(STORAGE_KEY);
  return savedData ? (JSON.parse(savedData) as MainProduct[]) : defaultProducts;
};

/**
 * Persist a new main product to LocalStorage and return the updated list.
 *
 * @param newProduct - Product data without an id (id is auto-generated).
 * @returns The full updated list of main products.
 */
export const saveMainProducts = (newProduct: Omit<MainProduct, 'id'>): MainProduct[] => {
  const products = getMainProducts();
  const updatedProducts: MainProduct[] = [
    ...products,
    { ...newProduct, id: Date.now() },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
  return updatedProducts;
};
