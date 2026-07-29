// src/services/supplierService.ts

import type { Supplier, SupplierProduct, ImportResponse } from '../types';

// ---------------------------------------------------------------------------
// In-memory store (used by linkProduct – kept for backward compatibility)
// ---------------------------------------------------------------------------
const supplierProducts: SupplierProduct[] = [];

// ---------------------------------------------------------------------------
// Static supplier catalogue
// ---------------------------------------------------------------------------
const suppliers: Supplier[] = [
  {
    id: 1,
    name: 'Stock UA',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/stock-123',
    productsCount: 145,
    status: 'Active',
    lastSync: '2024-05-20 10:30',
  },
  {
    id: 2,
    name: 'NewTime Distribution',
    sheetUrl: 'https://newtime.biz/price.xlsx',
    productsCount: 89,
    status: 'Pending',
    lastSync: null,
  },
  {
    id: 3,
    name: 'ERC (Electronic Resource)',
    sheetUrl: 'ftp://erc.ua/catalog.xml',
    productsCount: 0,
    status: 'Error',
    lastSync: '2024-05-19 18:00',
  },
  {
    id: 4,
    name: 'ASBIS Ukraine',
    sheetUrl: 'asbis_v3_api',
    productsCount: 1200,
    status: 'Active',
    lastSync: '2024-05-20 12:00',
  },
  {
    id: 5,
    name: 'MTI Hi-Tech Distri',
    sheetUrl: 'mti_price_list.csv',
    productsCount: 0,
    status: 'Pending',
    lastSync: null,
  },
];

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

/** Return the full list of suppliers. */
export const getSuppliers = (): Supplier[] => suppliers;

/**
 * Retrieve supplier products from LocalStorage for a given supplier.
 * Falls back to an empty array when no data exists.
 */
export const getSupplierProducts = (supplierId: number): SupplierProduct[] => {
  const localData = localStorage.getItem(`supplier_products_${supplierId}`);
  return localData ? (JSON.parse(localData) as SupplierProduct[]) : [];
};

/**
 * Link a supplier product to a main product (in-memory).
 *
 * **Note:** This operates on the local `supplierProducts` array, not
 * LocalStorage. In a production app this would be replaced by an API call.
 */
export const linkProduct = (
  supplierProductId: number | string,
  mainProductId: number,
): { success: boolean } => {
  const product = supplierProducts.find((p) => p.id === supplierProductId);
  if (product) {
    product.mainProductId = mainProductId;
    return { success: true };
  }
  return { success: false };
};

// ---------------------------------------------------------------------------
// Import Processing
// ---------------------------------------------------------------------------

/**
 * Simulate importing product data from a supplier.
 *
 * Returns a promise that resolves after a short delay (200 ms) with the
 * count of imported products and the product list filtered by `supplierId`.
 * Results are also persisted to LocalStorage under
 * `supplier_products_{supplierId}`.
 */
export const importSupplierData = (
  supplierId: number,
): Promise<ImportResponse> => {
  return new Promise<ImportResponse>((resolve) => {
    setTimeout(() => {
      const fakeProducts: SupplierProduct[] = [
        // Supplier 1: Apple tech & accessories
        {
          id: 's1-101',
          name: 'Apple iPhone 15 128GB Black (UA)',
          supplierSku: 'APP-IPH15-128BK',
          price: 32500,
          status: 'unmatched',
          supplierId: 1,
        },
        {
          id: 's1-102',
          name: 'Навушники AirPods Pro 2nd Gen with MagSafe Case (USB-C)',
          supplierSku: 'AP-PRO2-USBC',
          price: 9800,
          status: 'unmatched',
          supplierId: 1,
        },
        {
          id: 's1-103',
          name: 'MacBook Air 13 M3/8/256 Silver 2024',
          supplierSku: 'MBA-M3-SILVER',
          price: 48000,
          status: 'unmatched',
          supplierId: 1,
        },

        // Supplier 2: Samsung & peripherals (deliberately mangled names)
        {
          id: 's2-201',
          name: 'Смартфон Samsung S24 Ultra 12/256 Titanium Gray',
          supplierSku: 'SAM-S928-TG',
          price: 42000,
          status: 'unmatched',
          supplierId: 2,
        },
        {
          id: 's2-202',
          name: 'Миша ігрова Logitech G Pro X Superlight White (910-005942)',
          supplierSku: 'LOGI-GPX-W',
          price: 5200,
          status: 'unmatched',
          supplierId: 2,
        },

        // Supplier 3: Gaming (mixed naming)
        {
          id: 's3-301',
          name: 'Ігрова приставка Sony PS5 Slim Edition White',
          supplierSku: 'SONY-PS5-SLIM',
          price: 21500,
          status: 'unmatched',
          supplierId: 3,
        },
        {
          id: 's3-302',
          name: 'Ноутбук ASUS ROG Zephyrus G14 (GA403) 2024 Grey',
          supplierSku: 'ASUS-G14-2024',
          price: 75000,
          status: 'unmatched',
          supplierId: 3,
        },

        // Product NOT in the main catalogue (tests "No matches found")
        {
          id: 's3-303',
          name: 'Клавіатура Keychron K2 V2 Hot-swappable RGB',
          supplierSku: 'KEY-K2-V2',
          price: 3800,
          status: 'unmatched',
          supplierId: 3,
        },
      ];

      const filteredProducts = fakeProducts.filter(
        (p) => p.supplierId === Number(supplierId),
      );

      if (filteredProducts.length === 0) {
        resolve({ count: 0, products: [] });
        return;
      }

      const existingData: SupplierProduct[] = JSON.parse(
        localStorage.getItem('supplier_products') || '[]',
      );
      const updatedList = [...existingData, ...filteredProducts];

      localStorage.setItem(
        `supplier_products_${supplierId}`,
        JSON.stringify(updatedList),
      );

      resolve({
        count: filteredProducts.length,
        products: filteredProducts,
      });
    }, 200);
  });
};
