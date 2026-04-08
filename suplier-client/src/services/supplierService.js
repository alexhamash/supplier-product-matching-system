// Початкові дані
let supplierProducts = [];

// Список постачальників (додаємо поле status)
const suppliers = [
  {
    id: 1,
    name: "Stock",
    sheetUrl: "stock.xls",
    productsCount: 0,
    status: "Pending",
  },
  {
    id: 2,
    name: "NewTime",
    sheetUrl: "newtime.xls",
    productsCount: 0,
    status: "Pending",
  },
];

export const getSuppliers = () => suppliers;

export const getSupplierProducts = (supplierId) => {
  const localData = localStorage.getItem(`supplier_products_${supplierId}`) 
  return localData ? JSON.parse(localData) : [];
}

export const linkProduct = (supplierProductId, mainProductId) => {
  // В реальності тут буде API запит до бази даних
  const product = supplierProducts.find((p) => p.id === supplierProductId);
  if (product) {
    product.mainProductId = mainProductId; // Присвоюємо ID головного товару або null
    return { success: true };
  }
  return { success: false };
};

export const importSupplierData = (supplierId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const fakeProducts = [
        { id: Date.now(), name: "iPhone 15 Pro", supplierSku: "IPH15-PRO-G", price: 999, supplierId },
        { id: Date.now() + 1, name: "AirPods Max", supplierSku: "AP-MAX-W", price: 549, supplierId }
      ];
      // Зберігаємо в localStorage для синхронізації між сторінками
      localStorage.setItem(`supplier_products_${supplierId}`, JSON.stringify(fakeProducts));
      resolve({ count: fakeProducts.length });
    }, 200);
  });
};