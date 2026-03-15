import React from 'react';
import { Search, Filter, ChevronDown, ArrowRight, CheckCircle2, AlertCircle, Clock, Link as LinkIcon, AlertTriangle } from "lucide-react";

const SupplierProducts = () => {
  return (
    <div className="w-full">
      {/* Header section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-1">Supplier Products</h1>
          <p className="text-[#64748B] text-[15px]">View imported inventory and their matches to your main catalog.</p>
        </div>
        <button className="bg-[#3B82F6] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          Go to Matching Tool
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full max-w-[50%]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search supplier products or main products..."
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200 focus:border-slate-300 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto ml-auto">
          <div className="text-slate-400 hidden sm:block">
            <Filter className="w-4 h-4" />
          </div>

          <div className="relative w-full sm:w-[160px]">
            <select className="block w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-200 focus:border-slate-300 appearance-none bg-white cursor-pointer text-slate-700">
              <option>All Match Statuses</option>
              <option>Matched</option>
              <option>Unmatched</option>
              <option>Pending Review</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="relative w-full sm:w-[160px]">
            <select className="block w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-200 focus:border-slate-300 appearance-none bg-white cursor-pointer text-slate-700">
              <option>All Suppliers</option>
              <option>TechCorp Inc.</option>
              <option>Global Supply Co.</option>
              <option>Accessories Pro</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier Product</div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Match Status</div>
          <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Linked Main Product</div>
        </div>

        {/* Table Body - Row 1 (Matched) */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center">
          <div className="col-span-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
              <span className="text-slate-400 text-xs font-medium">IMG</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">Apple iPhone 13 128 Midnight</p>
              <p className="text-xs text-slate-500 mt-1">SKU: SUP-APP-13-128-M</p>
            </div>
          </div>
          <div className="col-span-2">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
              TechCorp Inc.
            </span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">Matched</span>
          </div>
          <div className="col-span-4">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
              <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-800 line-clamp-1">iPhone 13 128GB Midnight</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Main SKU: IPH-13-128-MDN</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Body - Row 2 (Matched to SAME main product from DIFFERENT supplier) */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center">
          <div className="col-span-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
              <span className="text-slate-400 text-xs font-medium">IMG</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">iPhone 13 128GB Black</p>
              <p className="text-xs text-slate-500 mt-1">SKU: GLB-IPH13-BLK</p>
            </div>
          </div>
          <div className="col-span-2">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
              Global Supply Co.
            </span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">Matched</span>
          </div>
          <div className="col-span-4">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
              <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-800 line-clamp-1">iPhone 13 128GB Midnight</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Main SKU: IPH-13-128-MDN</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Body - Row 3 (Unmatched) */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center">
          <div className="col-span-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
              <span className="text-slate-400 text-xs font-medium">IMG</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">Samsung Galaxy S23 Ultra 512GB Green</p>
              <p className="text-xs text-slate-500 mt-1">SKU: SM-S918B/DS</p>
            </div>
          </div>
          <div className="col-span-2">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
              TechCorp Inc.
            </span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">Unmatched</span>
          </div>
          <div className="col-span-4">
            <button className="w-full text-center py-2 px-3 border border-slate-300 border-dashed rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-colors font-medium">
              Find Match
            </button>
          </div>
        </div>

        {/* Table Body - Row 4 (Unmatched - different supplier) */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center">
          <div className="col-span-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
              <span className="text-slate-400 text-xs font-medium">IMG</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">S23 Ultra Green 512G</p>
              <p className="text-xs text-slate-500 mt-1">SKU: ACC-S23U-GRN-512</p>
            </div>
          </div>
          <div className="col-span-2">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100">
              Accessories Pro
            </span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">Unmatched</span>
          </div>
          <div className="col-span-4">
            <button className="w-full text-center py-2 px-3 border border-slate-300 border-dashed rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-colors font-medium">
              Find Match
            </button>
          </div>
        </div>

        {/* Table Body - Row 5 (Matched) */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center">
          <div className="col-span-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
              <span className="text-slate-400 text-xs font-medium">IMG</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">Sony WH-1000XM5 Noise Cancelling Headphones Silver</p>
              <p className="text-xs text-slate-500 mt-1">SKU: WH1000XM5S.CE7</p>
            </div>
          </div>
          <div className="col-span-2">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
              Global Supply Co.
            </span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">Matched</span>
          </div>
          <div className="col-span-4">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
              <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-800 line-clamp-1">Sony WH-1000XM5 Wireless ANC Headphones - Silver</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Main SKU: AUD-SNY-XM5-SLV</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">About the Central Product Catalog</h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              This list displays all products imported from your various supplier catalogs.
              Multiple supplier products (e.g. "Apple iPhone 13 128 Midnight" and "iPhone 13 128GB Black")
              can be matched to a single "Main Product" (e.g. "iPhone 13 128GB Midnight") in your store's internal catalog.
              Use the <span className="font-semibold">Matching Tool</span> to review unmatched products and link them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupplierProducts;
