// Початкові дані
let supplierProducts = []; 

// Список постачальників (додаємо поле status)
const suppliers = [
    { id: 1, name: "Stock", sheetUrl: "stock.xls", productsCount: 0, status: "Pending" },
    { id: 2, name: "NewTime", sheetUrl: "newtime.xls", productsCount: 0, status: "Pending" }
];

export const getSuppliers = () => suppliers;

export const getSupplierProducts = (supplierId) => {
    // Повертаємо тільки ті товари, що належать вибраному постачальнику
    return supplierProducts.filter(p => p.supplierId === supplierId);
};

// Функція для встановлення або розірвання зв'язку (US 9)
export const linkProduct = (supplierProductId, mainProductId) => {
    // В реальності тут буде API запит до бази даних
    const product = supplierProducts.find(p => p.id === supplierProductId);
    if (product) {
        product.mainProductId = mainProductId; // Присвоюємо ID головного товару або null
        return { success: true };
    }
    return { success: false };
};

// Імітація імпорту (US 5 & US 6)
export const importSupplierData = (supplierId) => {
    return new Promise((resolve, reject) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) return reject("Supplier not found");

        supplier.status = "In Progress"; // Встановлюємо статус згідно US 6

        // Імітуємо затримку мережі
        setTimeout(() => {
            // Емуляція успіху або помилки (Edge Case: network failure)
            const isSuccess = Math.random() > 0.1; 

            if (isSuccess) {
                // Додаємо фейкові товари для цього постачальника
                const newProducts = [
                    { id: Date.now(), supplierId, originalName: "IPH 16 Blk", price: 900, mainProductId: null },
                    { id: Date.now() + 1, supplierId, originalName: "iPhone 16 128GB Black", price: 910, mainProductId: null }
                ];
                
                supplierProducts = [...supplierProducts, ...newProducts];
                supplier.productsCount = newProducts.length;
                supplier.status = "Success";
                resolve({ message: "Import completed", count: newProducts.length });
            } else {
                supplier.status = "Failed";
                reject("Row 45: Missing mandatory field"); // Лог помилки згідно US 6
            }
        }, 2000); // 2 секунди "завантаження"
    });
};