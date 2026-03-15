import React from 'react';
import { Search, Filter, Plus, Package, Layers, ChevronDown } from "lucide-react";

const MainProducts = () => {
  return (
    <div className="w-full">
      {/* Header section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-1">Main Products</h1>
          <p className="text-[#64748B] text-[15px]">Manage your central store catalog. This is the source of truth for all mapped supplier products.</p>
        </div>
        <button className="bg-[#3B82F6] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Create Main Product
        </button>
      </div>

      {/* Filter section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center shadow-sm">
        <div className="relative flex-1 w-full max-w-[50%]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by main product name, SKU, or brand..."
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto ml-auto">
          <div className="text-slate-400 hidden sm:block">
            <Filter className="w-4 h-4" />
          </div>

          <div className="relative w-full sm:w-[160px]">
            <select className="block w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer text-slate-700">
              <option>All Categories</option>
              <option>Smartphones</option>
              <option>Audio</option>
              <option>Accessories</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="relative w-full sm:w-[160px]">
            <select className="block w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer text-slate-700">
              <option>All Brands</option>
              <option>Apple</option>
              <option>Samsung</option>
              <option>Sony</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-8">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Main Product Name & SKU</div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Brand</div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</div>
          <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Linked Supplier Products</div>
          <div className="col-span-1 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</div>
        </div>

        {/* Table Body - Row 1 */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center">
          <div className="col-span-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 text-blue-500">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">iPhone 13 128GB Midnight</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">SKU: IPH-13-128-MDN</p>
            </div>
          </div>
          <div className="col-span-2">
            <span className="text-sm font-medium text-slate-700">Apple</span>
          </div>
          <div className="col-span-2">
            <span className="text-sm text-slate-600">Smartphones</span>
          </div>
          <div className="col-span-3 flex items-center gap-2">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500" title="TechCorp Inc.">TC</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500" title="Global Supply Co.">GS</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500" title="Accessories Pro">AP</div>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              3 Linked
            </span>
          </div>
          <div className="col-span-1 text-right">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">Edit</button>
          </div>
        </div>

        {/* Table Body - Row 2 */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center">
          <div className="col-span-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 text-blue-500">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">Samsung Galaxy S23 Ultra 512GB Green</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">SKU: SAM-S23U-512-GRN</p>
            </div>
          </div>
          <div className="col-span-2">
            <span className="text-sm font-medium text-slate-700">Samsung</span>
          </div>
          <div className="col-span-2">
            <span className="text-sm text-slate-600">Smartphones</span>
          </div>
          <div className="col-span-3 flex items-center gap-2">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500" title="TechCorp Inc.">TC</div>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              1 Linked
            </span>
          </div>
          <div className="col-span-1 text-right">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">Edit</button>
          </div>
        </div>

        {/* Table Body - Row 3 */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center">
          <div className="col-span-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 text-blue-500">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">Sony WH-1000XM5 Wireless ANC Headphones - Silver</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">SKU: AUD-SNY-XM5-SLV</p>
            </div>
          </div>
          <div className="col-span-2">
            <span className="text-sm font-medium text-slate-700">Sony</span>
          </div>
          <div className="col-span-2">
            <span className="text-sm text-slate-600">Audio</span>
          </div>
          <div className="col-span-3 flex items-center gap-2">
             <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500" title="Global Supply Co.">GS</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500" title="Accessories Pro">AP</div>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              2 Linked
            </span>
          </div>
          <div className="col-span-1 text-right">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">Edit</button>
          </div>
        </div>
      </div>

       {/* Info Panel */}
       <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <Layers className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Central Product Catalog</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              These are the core products sold in your store. When you import inventory from suppliers (e.g., via Google Sheets or Excel),
              those external "Supplier Products" are linked to these internal "Main Products". This unified view allows you to manage
              pricing, stock, and descriptions centrally, regardless of how many different suppliers provide the item.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainProducts;
