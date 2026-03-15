import React, { useState } from 'react';
import { Search, Filter, Play, RefreshCw, Layers, CheckCircle2, XCircle, AlertCircle, SearchCode, ArrowRightLeft, Sparkles, PlusCircle } from "lucide-react";

const ProductMatching = () => {
  const [activeItem, setActiveItem] = useState(0);

  const queue = [
    { id: "SUP-APP-13-128-M", name: "Apple iPhone 13 128 Midnight", supplier: "TechCorp Inc.", brand: "Apple", category: "Smartphones" },
    { id: "GLB-IPH13-BLK", name: "iPhone 13 128GB Black", supplier: "Global Supply Co.", brand: "Apple", category: "Phones" },
    { id: "SM-S918B/DS", name: "Samsung Galaxy S23 Ultra 512GB Green", supplier: "TechCorp Inc.", brand: "Samsung", category: "Smartphones" },
    { id: "ACC-S23U-GRN-512", name: "S23 Ultra Green 512G", supplier: "Accessories Pro", brand: "Samsung", category: "Mobile" },
    { id: "WH1000XM5S.CE7", name: "Sony WH-1000XM5 Noise Cancelling Headphones Silver", supplier: "Global Supply Co.", brand: "Sony", category: "Audio" },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header section */}
      <div className="flex justify-between items-start mb-6 shrink-0">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-1">Product Matching</h1>
          <p className="text-[#64748B] text-[15px]">Review unmatched supplier inventory and link them to your central catalog.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4" />
            Refresh Queue
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Sparkles className="w-4 h-4" />
            Auto-Match All (AI)
          </button>
        </div>
      </div>

      {/* Main Content Area - Split View */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">

        {/* Left Side: Unmatched Queue */}
        <div className="w-full lg:w-[35%] flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[calc(100vh-140px)]">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-800">Unmatched Queue</h2>
            </div>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-md">
              {queue.length} Pending
            </span>
          </div>

          <div className="p-4 border-b border-slate-100 shrink-0 bg-white">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search supplier products..."
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-slate-50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
             {queue.map((item, i) => (
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
                      {item.supplier}
                    </span>
                    {i === 0 && <span className="text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">AI Suggested</span>}
                  </div>
                </div>
             ))}
          </div>
        </div>

        {/* Right Side: Matching Workspace */}
        <div className="w-full lg:w-[65%] flex flex-col h-[calc(100vh-140px)]">

          {/* Active Supplier Product Details Panel */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-4 shrink-0">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">1</span>
              <h3 className="font-semibold text-slate-800 text-sm">Supplier Product to Match</h3>
            </div>

            <div className="p-6 flex items-start gap-6 bg-white">
              <div className="w-24 h-24 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center shrink-0">
                 <span className="text-sm font-bold text-slate-400">IMG</span>
              </div>

              <div className="flex-1">
                 <div className="flex items-start justify-between mb-2">
                   <h2 className="text-xl font-bold text-slate-900 leading-tight">Apple iPhone 13 128 Midnight</h2>
                   <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                      Supplier: <strong className="ml-1">TechCorp Inc.</strong>
                   </span>
                 </div>

                 <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Supplier SKU</p>
                      <p className="text-sm font-mono font-medium text-slate-800">SUP-APP-13-128-M</p>
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

          {/* Catalog Search & Suggestions Panel */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">2</span>
                <h3 className="font-semibold text-slate-800 text-sm">Select Main Product from Catalog</h3>
              </div>

              <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1.5 transition-colors">
                <PlusCircle className="w-4 h-4" />
                Create New Main Product
              </button>
            </div>

            <div className="p-5 border-b border-slate-100 bg-white shrink-0">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <SearchCode className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search internal catalog by product name, Main SKU, or brand..."
                  className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm"
                  defaultValue="iPhone 13 128"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/30 p-5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                AI Suggested Matches
              </h4>

              <div className="space-y-4">
                {/* High Confidence Suggestion */}
                <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-5 hover:shadow-md transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-bl-lg border-b border-l border-emerald-200 uppercase tracking-wide">
                    98% Match (Name & Brand)
                  </div>

                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-xs font-bold text-slate-400">IMG</span>
                    </div>

                    <div className="flex-1">
                      <h5 className="text-lg font-bold text-slate-900 mb-1">iPhone 13 128GB Midnight</h5>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 mb-4">
                        <span className="flex items-center gap-1.5">
                          <span className="text-slate-400">Main SKU:</span>
                          <span className="font-mono font-medium text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">IPH-13-128-MDN</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-slate-400">Brand:</span>
                          <span className="font-medium text-slate-800">Apple</span>
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Confirm Match
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                 {/* Lower Confidence Suggestion */}
                 <div className="border border-slate-200 bg-white rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all relative group">
                  <div className="absolute top-0 right-0 bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-bl-lg border-b border-l border-slate-200 uppercase tracking-wide">
                    65% Match (Category)
                  </div>

                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                       <span className="text-xs font-bold text-slate-400">IMG</span>
                    </div>

                    <div className="flex-1">
                      <h5 className="text-base font-semibold text-slate-800 mb-1">iPhone 13 256GB Midnight</h5>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 mb-4">
                        <span className="flex items-center gap-1.5">
                          <span className="text-slate-400">Main SKU:</span>
                          <span className="font-mono text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">IPH-13-256-MDN</span>
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <button className="flex-1 bg-white border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm">
                          Select This Match
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-8 flex items-center justify-center border-t border-slate-200 pt-6">
                <button className="text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-slate-100">
                  <XCircle className="w-4 h-4" />
                  Reject & Mark as Unmatchable
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductMatching;