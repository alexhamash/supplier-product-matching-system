import React, { useState } from 'react';
import { Search, Plus, Sparkles, Database, CheckCircle2, Layers, XCircle, SearchCode, Package, PlusCircle } from "lucide-react";

const ProductMatching = () => {
  const [activeItem, setActiveItem] = useState(0);

  // Updated queue to represent "Main Products" in the catalog
  const mainProductsQueue = [
    { id: "IPH-13-128-MDN", name: "iPhone 13 128GB Midnight", brand: "Apple", category: "Smartphones", linkedCount: 2 },
    { id: "SAM-S23U-512-GRN", name: "Samsung Galaxy S23 Ultra 512GB Green", brand: "Samsung", category: "Smartphones", linkedCount: 1 },
    { id: "AUD-SNY-XM5-SLV", name: "Sony WH-1000XM5 Wireless ANC Headphones - Silver", brand: "Sony", category: "Audio", linkedCount: 2 },
    { id: "IPAD-AIR-5-64-BLU", name: "iPad Air (5th Gen) 64GB Blue", brand: "Apple", category: "Tablets", linkedCount: 0 },
    { id: "MAC-PRO-14-M2", name: "MacBook Pro 14 M2 Pro 512GB Space Gray", brand: "Apple", category: "Laptops", linkedCount: 0 },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header section */}
      <div className="flex justify-between items-start mb-6 shrink-0">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-1">Product Linking</h1>
          <p className="text-[#64748B] text-[15px]">Select a main catalog item to review and link incoming supplier products to it.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            New Main Product
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Sparkles className="w-4 h-4" />
            Auto-Link All (AI)
          </button>
        </div>
      </div>

      {/* Main Content Area - Split View */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">

        {/* Left Side: Main Products Catalog */}
        <div className="w-full lg:w-[35%] flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[calc(100vh-140px)]">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-800">Main Catalog</h2>
            </div>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-md">
              {mainProductsQueue.length} Items
            </span>
          </div>

          <div className="p-4 border-b border-slate-100 shrink-0 bg-white">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search main products..."
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-slate-50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
             {mainProductsQueue.map((item, i) => (
                <div
                  key={i}
                  onClick={() => setActiveItem(i)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    i === activeItem
                      ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className={`text-sm font-semibold leading-snug line-clamp-2 pr-2 ${i === activeItem ? 'text-indigo-900' : 'text-slate-900'}`}>
                      {item.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                      {item.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-slate-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      {item.brand}
                    </span>
                    <span className={`font-medium px-1.5 py-0.5 rounded border ${
                      item.linkedCount > 0
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {item.linkedCount} Linked
                    </span>
                  </div>
                </div>
             ))}
          </div>
        </div>

        {/* Right Side: Linking Workspace */}
        <div className="w-full lg:w-[65%] flex flex-col h-[calc(100vh-140px)]">

          {/* Top Panel: Selected Main Product Details */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-4 shrink-0">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">1</span>
              <h3 className="font-semibold text-slate-800 text-sm">Target Main Product</h3>
            </div>

            <div className="p-6 flex items-start gap-6 bg-white">
              <div className="w-24 h-24 bg-blue-50 rounded-xl border border-blue-100 flex flex-col items-center justify-center shrink-0 text-blue-500">
                 <Package className="w-8 h-8" />
              </div>

              <div className="flex-1">
                 <div className="flex items-start justify-between mb-2">
                   <h2 className="text-xl font-bold text-slate-900 leading-tight">iPhone 13 128GB Midnight</h2>
                   <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      2 Suppliers Currently Linked
                   </span>
                 </div>

                 <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Main SKU</p>
                      <p className="text-sm font-mono font-medium text-slate-800">IPH-13-128-MDN</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Brand</p>
                      <p className="text-sm font-medium text-slate-800">Apple</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</p>
                      <p className="text-sm font-medium text-slate-800">Smartphones</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Bottom Panel: Find Supplier Products to Link */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">2</span>
                <h3 className="font-semibold text-slate-800 text-sm">Find Supplier Products to Link</h3>
              </div>

              <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1.5 transition-colors">
                <Layers className="w-4 h-4" />
                View Currently Linked
              </button>
            </div>

            {/* Manual Search Bar */}
            <div className="p-5 border-b border-slate-100 bg-white shrink-0">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <SearchCode className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Manually search unmatched supplier products by SKU or Name..."
                  className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm"
                />
              </div>
            </div>

            {/* AI Suggestions List */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30 p-5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                AI Suggested Supplier Products
              </h4>

              <div className="space-y-4">
                {/* Suggestion 1 - High Match */}
                <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-5 hover:shadow-md transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-bl-lg border-b border-l border-emerald-200 uppercase tracking-wide">
                    95% Match (Name & Brand)
                  </div>

                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-xs font-bold text-slate-400">IMG</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-lg font-bold text-slate-900">Apple iPhone 13 128 Midnight</h5>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase border border-slate-200">
                          TechCorp Inc.
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 mb-4">
                        <span className="flex items-center gap-1.5">
                          <span className="text-slate-400">Supplier SKU:</span>
                          <span className="font-mono font-medium text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">SUP-APP-13-128-M</span>
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Link to Main Product
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                 {/* Suggestion 2 - Medium Match */}
                 <div className="border border-slate-200 bg-white rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all relative group">
                  <div className="absolute top-0 right-0 bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-bl-lg border-b border-l border-slate-200 uppercase tracking-wide">
                    80% Match (SKU Pattern)
                  </div>

                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                       <span className="text-xs font-bold text-slate-400">IMG</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-base font-semibold text-slate-800">iPhone 13 128GB Black</h5>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase border border-slate-200">
                          Global Supply Co.
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 mb-4">
                        <span className="flex items-center gap-1.5">
                          <span className="text-slate-400">Supplier SKU:</span>
                          <span className="font-mono text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">GLB-IPH13-BLK</span>
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <button className="flex-1 bg-white border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2">
                           <PlusCircle className="w-4 h-4" />
                           Link to Main Product
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductMatching;