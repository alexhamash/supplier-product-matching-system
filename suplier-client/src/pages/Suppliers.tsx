import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search,Plus,RefreshCw,FileSpreadsheet, CheckCircle2 } from "lucide-react";

import { getSuppliers } from "../services/supplierService";
import { useProducts } from "../context/ProductContext";
import type { Supplier } from "../types";

const Suppliers = () => {
  // const [suppliers, setSuppliers] = useState([]);

  const {supplier, setSupplier, updateSupplier } = useProducts()
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "", 
    sheetUrl: "",
  });

  const [isFormVisible, setIsFormVisible] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    const savedSuppliers = localStorage.getItem("suppliers");

    if (savedSuppliers) {
      setSupplier(JSON.parse(savedSuppliers));
    } else {
      const data = getSuppliers();
      setSupplier(data);
    }
  }, []); // Виконується 1 раз

  useEffect(() => {
    localStorage.setItem("suppliers", JSON.stringify(supplier));
  }, [supplier]); 

  const handleInputChange = (e: any) => {
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

  const handleSubmit = () => {

    if (!formData.name.trim()) {
      alert("Назва постачальника обовязкова");
      return;
    }

    if(editingId) {
      updateSupplier({...formData, id: editingId, productsCount: 0, status: 'Active', lastSync: null})
    } else {
      const newSupplier: Supplier = {
        ...formData,
        id: Date.now(),
        productsCount: 0,
        status: 'Active',
        lastSync: null
      }
      setSupplier([...supplier, newSupplier])
    }
  
    setIsFormVisible(false);
    setEditingId(null);
    setFormData({ name: "", sheetUrl: "" });
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
        <button
          onClick={() => setIsFormVisible(!isFormVisible)}
          className="bg-[#3B82F6] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isFormVisible ? "Cancel" : "Create New Supplier"}
        </button>
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
            onChange={(e) => setSearchTerm(e.target.value)}
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
                  onClick={() => {
                    if (window.confirm("Видалити цього постачальника?")) {
                      const updatedSuppliers = supplier.filter((item) => item.id !== s.id);
                      setSupplier(updatedSuppliers);
                      localStorage.setItem("suppliers", JSON.stringify(updatedSuppliers));
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
