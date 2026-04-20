// Початкові дані
let supplierProducts = [];

const suppliers = [
  {
    id: 1,
    name: "Stock UA",
    sheetUrl: "https://docs.google.com/spreadsheets/d/stock-123",
    productsCount: 145, // Вже імпортовані товари
    status: "Active", // Працює, дані актуальні
    lastSync: "2024-05-20 10:30",
  },
  {
    id: 2,
    name: "NewTime Distribution",
    sheetUrl: "https://newtime.biz/price.xlsx",
    productsCount: 89,
    status: "Pending", // Очікує першого імпорту або налаштування
    lastSync: null,
  },
  {
    id: 3,
    name: "ERC (Electronic Resource)",
    sheetUrl: "ftp://erc.ua/catalog.xml",
    productsCount: 0,
    status: "Error", // Проблема з лінком або доступом
    lastSync: "2024-05-19 18:00",
  },
  {
    id: 4,
    name: "ASBIS Ukraine",
    sheetUrl: "asbis_v3_api",
    productsCount: 1200,
    status: "Active",
    lastSync: "2024-05-20 12:00",
  },
  {
    id: 5,
    name: "MTI Hi-Tech Distri",
    sheetUrl: "mti_price_list.csv",
    productsCount: 0,
    status: "Pending",
    lastSync: null,
  },
];

export const getSuppliers = () => suppliers;

export const getSupplierProducts = (supplierId) => {
  const localData = localStorage.getItem(`supplier_products_${supplierId}`);
  return localData ? JSON.parse(localData) : [];
};

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
      const  fakeProducts = [
        // Постачальник 1: Техніка Apple та аксесуари
        {
          id: "s1-101",
          name: "Apple iPhone 15 128GB Black (UA)",
          supplierSku: "APP-IPH15-128BK",
          price: 32500,
          status: "unmatched",
          supplierId: 1,
        },
        {
          id: "s1-102",
          name: "Навушники AirPods Pro 2nd Gen with MagSafe Case (USB-C)",
          supplierSku: "AP-PRO2-USBC",
          price: 9800,
          status: "unmatched",
          supplierId: 1,
        },
        {
          id: "s1-103",
          name: "MacBook Air 13 M3/8/256 Silver 2024",
          supplierSku: "MBA-M3-SILVER",
          price: 48000,
          status: "unmatched",
          supplierId: 1,
        },

        // Постачальник 2: Samsung та Периферія (спеціально "криві" назви)
        {
          id: "s2-201",
          name: "Смартфон Samsung S24 Ultra 12/256 Titanium Gray",
          supplierSku: "SAM-S928-TG",
          price: 42000,
          status: "unmatched",
          supplierId: 2,
        },
        {
          id: "s2-202",
          name: "Миша ігрова Logitech G Pro X Superlight White (910-005942)",
          supplierSku: "LOGI-GPX-W",
          price: 5200,
          status: "unmatched",
          supplierId: 2,
        },

        // Постачальник 3: Геймінг (змішані назви)
        {
          id: "s3-301",
          name: "Ігрова приставка Sony PS5 Slim Edition White",
          supplierSku: "SONY-PS5-SLIM",
          price: 21500,
          status: "unmatched",
          supplierId: 3,
        },
        {
          id: "s3-302",
          name: "Ноутбук ASUS ROG Zephyrus G14 (GA403) 2024 Grey",
          supplierSku: "ASUS-G14-2024",
          price: 75000,
          status: "unmatched",
          supplierId: 3,
        },

        // Товар, якого НЕМАЄ в головному каталозі (для тестування "No matches found")
        {
          id: "s3-303",
          name: "Клавіатура Keychron K2 V2 Hot-swappable RGB",
          supplierSku: "KEY-K2-V2",
          price: 3800,
          status: "unmatched",
          supplierId: 3,
        },
      ];

      const filteredProducts = fakeProducts.filter(
        (p) => p.supplierId === Number(supplierId)
      )

      if (filteredProducts.length === 0) {
        resolve({ count: 0, products: [] });
          return; 
      }

      const existingData = JSON.parse(localStorage.getItem("supplier_products") || "[]")
      const updatedList = [...existingData, ...filteredProducts]

      localStorage.setItem(`supplier_products_${supplierId}`, JSON.stringify(updatedList),);
      
      resolve({ 
        count: filteredProducts.length,
        products: filteredProducts
      });
    }, 200);
  });
};
