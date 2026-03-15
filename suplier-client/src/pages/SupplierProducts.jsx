import React from 'react';
import { Search, Filter, ChevronDown, ArrowRight } from "lucide-react";

const SupplierProducts = () => {
  return (
    <div className="w-full">
      {/* Header section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-1">Supplier Products</h1>
          <p className="text-[#64748B] text-[15px]">View and filter all imported inventory.</p>
        </div>
        <button className="bg-[#3B82F6] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          Go to Matching Tool
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full max-w-[60%]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200 focus:border-slate-300 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto ml-auto">
          <div className="text-slate-400 hidden sm:block">
            <Filter className="w-4 h-4" />
          </div>

          <div className="relative w-full sm:w-[180px]">
            <select className="block w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-200 focus:border-slate-300 appearance-none bg-white cursor-pointer text-slate-700">
              <option>All Statuses</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="relative w-full sm:w-[180px]">
            <select className="block w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-200 focus:border-slate-300 appearance-none bg-white cursor-pointer text-slate-700">
              <option>All Suppliers</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-slate-200 bg-white">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catalog Match</div>
        </div>

        {/* Empty State Body */}
        <div className="flex items-center justify-center p-12 h-64">
          <p className="text-slate-500 text-[15px]">No products found matching your filters.</p>
        </div>
      </div>
    </div>
  );
}

export default SupplierProducts;
