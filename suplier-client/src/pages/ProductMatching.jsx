import React from 'react';
import { Search, Filter, Play, RefreshCw, Layers } from "lucide-react";

const ProductMatching = () => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-1">Product Matching</h1>
          <p className="text-[#64748B] text-[15px]">Map supplier inventory to your internal catalog.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4" />
            Refresh Rules
          </button>
          <button className="bg-[#3B82F6] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Play className="w-4 h-4" />
            Run Auto-Match
          </button>
        </div>
      </div>

      {/* Main Content Area - Split View */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left Side: Unmatched Queue */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 h-[calc(100vh-220px)] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              Unmatched Queue
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">3,339</span>
          </div>

          <div className="px-4 pb-2 pt-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search queue..."
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200 focus:border-slate-300 transition-colors bg-slate-50/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
             {/* Sample Queue Items */}
             {[
               { id: "SKU-T120", name: "Wireless Earbuds Pro", supplier: "TechCorp Inc." },
               { id: "MKB-882", name: "Mechanical Keyboard", supplier: "Global Supply Co." },
               { id: "MO-G305", name: "Gaming Mouse Black", supplier: "TechCorp Inc." },
               { id: "USB-C-3M", name: "Type-C Charging Cable 3m", supplier: "Accessories Pro" },
               { id: "HDMI-8K", name: "Premium HDMI Cable 2m", supplier: "Accessories Pro" },
               { id: "SD-128G", name: "MicroSD Card 128GB", supplier: "Global Supply Co." },
             ].map((item, i) => (
                <div key={i} className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  i === 0 ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300'
                }`}>
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-semibold text-slate-900 leading-tight">{item.name}</p>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{item.id}</span>
                  </div>
                  <p className="text-xs text-slate-500">{item.supplier}</p>
                </div>
             ))}
          </div>
        </div>

        {/* Right Side: Matching Workspace */}
        <div className="w-full lg:w-2/3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-220px)]">

          {/* Active Item Details */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-start justify-between mb-4">
               <div>
                 <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                    Active Item
                 </span>
                 <h2 className="text-2xl font-bold text-slate-900 leading-tight">Wireless Earbuds Pro</h2>
                 <p className="text-sm text-slate-500 mt-1">Supplier: <span className="font-medium text-slate-700">TechCorp Inc.</span> | Supplier SKU: <span className="font-mono text-slate-700">SKU-T120</span></p>
               </div>
               <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">$45.00</p>
                  <p className="text-xs text-slate-500 mt-0.5">Cost Price</p>
               </div>
            </div>

            {/* Description/Specs snippet */}
             <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-600 mt-4 leading-relaxed line-clamp-2">
               Active noise cancelling wireless earbuds with charging case. 24h battery life, IPX4 water resistant, Bluetooth 5.2. Includes 3 sizes of silicone tips.
             </div>
          </div>

          {/* Catalog Search & Suggestions */}
          <div className="p-6 flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Search Internal Catalog</h3>

            <div className="relative w-full mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search catalog by product name, SKU, or UPC..."
                className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
              />
              <button className="absolute inset-y-1 right-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-sm font-medium transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-sm font-medium text-slate-500 mb-3">AI Suggestions (2)</h4>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
              {/* Suggestion 1 */}
              <div className="border border-green-200 bg-green-50/30 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-slate-400">IMG</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-bold text-slate-900">SoundCore Pro Wireless Earbuds</h5>
                      <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide">98% Match</span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span className="font-mono">SKU: INT-EP01</span>
                      <span>Category: Audio & Headphones</span>
                    </div>
                  </div>
                </div>
                <button className="bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm">
                  Match Product
                </button>
              </div>

               {/* Suggestion 2 */}
               <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                     <span className="text-xs font-bold text-slate-400">IMG</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold text-slate-800">Basic Wireless Earphones</h5>
                      <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide">65% Match</span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span className="font-mono">SKU: INT-EB99</span>
                      <span>Category: Audio & Headphones</span>
                    </div>
                  </div>
                </div>
                <button className="bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm">
                  Match Product
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center mt-4">
              <button className="text-slate-500 hover:text-slate-700 text-sm font-medium px-2 py-1">Skip Item</button>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1">Create New Product in Catalog</button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductMatching;
