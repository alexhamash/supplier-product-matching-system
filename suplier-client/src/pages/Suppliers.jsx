import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, RefreshCw, MoreVertical, FileSpreadsheet, Link as LinkIcon, CheckCircle2, Clock } from "lucide-react";
// 1. Імпортуємо наш сервіс (створи його, якщо він зник)
import { getSuppliers } from '../services/supplierService'; 

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 2. Завантажуємо реальних постачальників при старті
  useEffect(() => {
    const data = getSuppliers();
    setSuppliers(data);
  }, []);

  // 3. Фільтрація за пошуком
  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto pb-12">
      {/* Header - залишаємо як був */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-1">Suppliers & Catalogs</h1>
          <p className="text-[#64748B] text-[15px]">Manage your connected suppliers and import catalogs.</p>
        </div>
        <button className="bg-[#3B82F6] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-600 transition-colors">
          <Plus className="w-4 h-4" /> Connect New Supplier
        </button>
      </div>

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
          <div className="col-span-1 text-right">Actions</div>
        </div>

        <div className="divide-y divide-slate-100">
          {/* 4. МАГІЯ: Замість статичних рядків робимо .map() */}
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-50/50 transition-colors group">
              <div className="col-span-3 flex items-center gap-3">
                {/* Аватарка з першою літерою */}
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center border border-blue-100">
                  {supplier.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{supplier.name}</p>
                  <p className="text-xs text-slate-500">ID: {supplier.id}</p>
                </div>
              </div>

              <div className="col-span-4">
                 <div className="flex items-center gap-2 mb-1">
                   <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                   <span className="text-sm font-medium text-slate-700">Source Link</span>
                 </div>
                 <a href={supplier.sheetUrl} className="text-xs text-blue-600 truncate block pr-4">
                   {supplier.sheetUrl}
                 </a>
              </div>

              <div className="col-span-2 text-sm text-slate-800">
                {supplier.productsCount || 0} items
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Synced
                </div>
              </div>

              <div className="col-span-1 flex justify-end">
                 {/* 5. НАШ ВАЖЛИВИЙ ЛІНК */}
                 <Link 
                   to={`/suppliers/${supplier.id}/import`}
                   className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                 >
                   <RefreshCw className="w-4 h-4" />
                 </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Suppliers;