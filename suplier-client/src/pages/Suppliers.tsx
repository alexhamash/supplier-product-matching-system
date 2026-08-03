import React, { useState, useEffect, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { Search,Plus,RefreshCw,FileSpreadsheet, CheckCircle2, Sparkles } from "lucide-react";

import { getSuppliers, createSupplier, importSupplierProducts, deleteSupplier } from "../services/supplierService";
import { useProducts } from "../context/ProductContext";

const Suppliers: React.FC = () => {
  const { supplier, updateSupplier, refresh } = useProducts()
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [formData, setFormData] = useState<{ name: string; sheetUrl: string }>({
    name: "",
    sheetUrl: "",
  });

  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [demoLoading, setDemoLoading] = useState<boolean>(false);

  /**
   * Generate a demo supplier with a unique name and batch-import 5 sample products.
   * Refreshes the supplier list from the backend after completion.
   */
  const handleGenerateDemo = async (): Promise<void> => {
    setDemoLoading(true);
    try {
      // 1. Build the demo products payload
      const demoProducts = [
        { rawSku: "TSC-001", rawName: "Wireless Bluetooth Headphones", price: 49.99 },
        { rawSku: "TSC-002", rawName: "USB-C Charging Cable 2m", price: 12.99 },
        { rawSku: "TSC-003", rawName: "Laptop Stand Adjustable", price: 34.50 },
        { rawSku: "TSC-004", rawName: "Mechanical Keyboard RGB", price: 89.99 },
        { rawSku: "TSC-005", rawName: "Ergonomic Mouse Wireless", price: 29.99 },
      ];

      // 2. Use a unique name so creating demo data never triggers a 409 Conflict
      //    (the backend enforces a unique constraint on supplier name).
      const uniqueName = `Demo Tech Supplier ${Date.now()}`;

      let targetSupplierId: string;

      try {
        const createdSupplier = await createSupplier({
          name: uniqueName,
          contactInfo: "https://demo-catalog.example.com/sheet",
        });
        targetSupplierId = createdSupplier.id;
      } catch (createErr) {
        // 3. Fallback: if creation failed (e.g. 409 Conflict), reuse the first
        //    existing supplier instead of throwing an unhandled error.
        console.warn("Demo supplier creation failed, falling back to existing supplier:", createErr);
        const existingSuppliers = await getSuppliers();
        const fallbackSupplier = existingSuppliers[0];
        if (!fallbackSupplier) {
          throw new Error("No existing supplier available to attach demo products to.");
        }
        targetSupplierId = fallbackSupplier.id;
      }

      // 4. Batch-import the 5 sample products for the resolved supplier
      await importSupplierProducts(targetSupplierId, {
        products: demoProducts,
      });

      // 5. Refresh the full supplier list from the backend
      await refresh();
    } catch (err) {
      console.error("Failed to generate demo data:", err);
      alert("Failed to generate demo supplier. Please check the console for details.");
    } finally {
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [refresh]); // Виконується 1 раз

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // const handleSubmit = () => {
  //   if (!formData.name.trim()) {
  //     alert("Назва постачальника обов'язкова!");
  //     return;
  //   }

  //   if (editingId) {
  //     const updatedSuppliers = supplier.map((s) => {
  //       s.id === editingId ? { ...s, ...formData } : s;
  //     });
  //     setSupplier(updateSupplier);
  //     setEditingId(null);
  //   } else {
  //     const newSupplier = {
  //       ...formData,
  //       id: Date.now(),
  //       productsCount: 0,
  //     };

  //     setSupplier([...supplier, newSupplier]);
  //   }

  //   setIsFormVisible(false);
  //   setFormData({ name: "", sheetUrl: "" });
  // };

  const handleSubmit = async (): Promise<void> => {
    if (!formData.name.trim()) {
      alert("Назва постачальника обовязкова");
      return;
    }

    try {
      if (editingId) {
        await updateSupplier({
          ...formData,
          id: editingId,
          productsCount: 0,
          status: 'Active',
          lastSync: null,
        });
      } else {
        await createSupplier({
          name: formData.name,
          contactInfo: formData.sheetUrl,
        });
        await refresh();
      }

      setIsFormVisible(false);
      setEditingId(null);
      setFormData({ name: "", sheetUrl: "" });
    } catch (err) {
      console.error("Failed to save supplier:", err);
      alert("Failed to save supplier. Please check the console for details.");
    }
  };

  // const handleDelete = (id) => {
  //   setSuppliers((prevSuppliers) =>
  //     prevSuppliers.filter((supplier) => supplier.id !== id),
  //   );
  // };

  // const handleEdit = (supplier) => {
  //   setFormData({ name: supplier.name, sheetUrl: supplier.sheetUrl });
  //   setEditingId(supplier.id);
  //   setIsFormVisible(true);
  // };

  // 3. Фільтрація за пошуком
  const filteredSuppliers = supplier.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full max-w-6xl mx-auto pb-12">
      {/* Header - залишаємо як був */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-1">
            Suppliers & Catalogs
          </h1>
          <p className="text-[#64748B] text-[15px]">
            Manage your connected suppliers and import catalogs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateDemo}
            disabled={demoLoading}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className={`w-4 h-4 ${demoLoading ? "animate-spin" : ""}`} />
            {demoLoading ? "Generating..." : "Generate Demo Supplier with Products"}
          </button>
          <button
            onClick={() => setIsFormVisible(!isFormVisible)}
            className="bg-[#3B82F6] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {isFormVisible ? "Cancel" : "Create New Supplier"}
          </button>
        </div>
      </div>

      {/* Форма додавання постачальника */}
      {isFormVisible && (
        <div className="bg-slate-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 text-slate-900">
            {editingId ? "Edit Supplier" : "Add New Supplier"}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              name="name" // Додаємо name для handleInputChange
              value={formData.name}
              onChange={handleInputChange}
              className="p-2 border border-slate-200 rounded-lg text-sm"
              placeholder="Supplier Name"
            />
            <input
              name="sheetUrl" // Додаємо sheet для handleInputChange
              value={formData.sheetUrl}
              onChange={handleInputChange}
              className="p-2 border border-slate-200 rounded-lg text-sm"
              placeholder="Sheet URL"
            />
            <button
              onClick={handleSubmit} // Кнопка додати
              className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-medium transition-colors"
            >
              Add Supplier
            </button>
          </div>
        </div>
      )}

      {/* Пошук - підключаємо searchTerm */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50"
          />
        </div>
      </div>

      {/* Таблиця */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase">
          <div className="col-span-3">Supplier Name</div>
          <div className="col-span-4">Catalog Source</div>
          <div className="col-span-2">Products</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>

        <div className="divide-y divide-slate-100">
          {/* 4. МАГІЯ: Замість статичних рядків робимо .map() */}
          {filteredSuppliers.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-50/50 transition-colors group"
            >
              <div className="col-span-3 flex items-center gap-3">
                {/* Аватарка з першою літерою */}
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center border border-blue-100">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {s.name}
                  </p>
                  <p className="text-xs text-slate-500">ID: {s.id}</p>
                </div>
              </div>

              <div className="col-span-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Source Link
                  </span>
                </div>
                <a
                  href={s.sheetUrl}
                  className="text-xs text-blue-600 truncate block pr-4"
                >
                  {s.sheetUrl}
                </a>
              </div>

              <div className="col-span-2 text-sm text-slate-800">
                {s.productsCount || 0} items
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Synced
                </div>
              </div>

              <div className="col-span-1 flex justify-end gap-2 items-center">
                {/* Існуюча кнопка імпорту */}
                <Link
                  to={`/suppliers/${s.id}/import`}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </Link>

                <button
                  onClick={async () => {
                    if (!window.confirm("Видалити цього постачальника?")) return;
                    try {
                      // Call the real DELETE /api/suppliers/:id endpoint
                      await deleteSupplier(s.id);
                      // Only update local state after a successful backend deletion
                      await refresh();
                    } catch (err) {
                      console.error("Failed to delete supplier:", err);
                      alert("Failed to delete supplier. Please check the console for details.");
                    }
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                >
                  Del
                </button>
                <button
                  onClick={() => {
                    setFormData({ name: s.name, sheetUrl: s.sheetUrl });
                    setEditingId(s.id);
                    setIsFormVisible(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Suppliers;
