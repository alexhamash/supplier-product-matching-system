import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Sparkles,
  Database,
  CheckCircle2,
  Layers,
  XCircle,
  SearchCode,
  Package,
  PlusCircle,
} from "lucide-react";
import { getMainProducts } from "../services/mainProductService";
import {
  getSupplierProducts,
  importSupplierData,
} from "../services/supplierService";

import { getSupplierSuggestions } from '../services/matchingService';

const ProductMatching = () => {
  const [mainProducts, setMainProducts] = useState([]);
  const [activeItem, setActiveItem] = useState(0);
  const [allSupplierProducts, setAllSupplierProducts] = useState([]);

  useEffect(() => {
    const data = getMainProducts();
    setMainProducts(data);

    importSupplierData(1).then(() => {
      const sData = getSupplierProducts(1);
      setAllSupplierProducts(sData);
    });
  }, []);

  const selectedProduct = mainProducts[activeItem] || null;

  const suggestions = getSupplierSuggestions(selectedProduct, allSupplierProducts);

  // const suggestions = allSupplierProducts.filter((item) =>
  //   item.originalName
  //     .toLowerCase()
  //     .includes(selectedProduct?.brand?.toLowerCase()),
  // );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header section */}
      <div className="flex justify-between items-start mb-6 shrink-0">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-1">
            Product Linking
          </h1>
          <p className="text-[#64748B] text-[15px]">
            Select a main catalog item to review and link incoming supplier
            products to it.
          </p>
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
              {mainProducts.length} Items
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
            {mainProducts.map((item, index) => (
              <div
                key={item.id}
                onClick={() => setActiveItem(index)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  index === activeItem
                    ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500 shadow-sm"
                    : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p
                    className={`text-sm font-semibold leading-snug line-clamp-2 pr-2 ${index === activeItem ? "text-indigo-900" : "text-slate-900"}`}
                  >
                    {item.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                    {item.SKU}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-2">
                  <span className="text-slate-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    {item.brand}
                  </span>
                  <span
                    className={`font-medium px-1.5 py-0.5 rounded border ${
                      item.linkedCount > 0
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-amber-50 text-amber-600 border-amber-100"
                    }`}
                  >
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
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                1
              </span>
              <h3 className="font-semibold text-slate-800 text-sm">
                Target Main Product
              </h3>
            </div>

            <div className="p-6 flex items-start gap-6 bg-white">
              <div className="w-24 h-24 bg-blue-50 rounded-xl border border-blue-100 flex flex-col items-center justify-center shrink-0 text-blue-500">
                <Package className="w-8 h-8" />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">
                    {selectedProduct?.name || "Оберіть товар"}
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                    0 Suppliers Currently Linked
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Main SKU
                    </p>
                    <p className="text-sm font-mono font-medium text-slate-800">
                      {selectedProduct?.SKU}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Brand
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedProduct?.brand}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Category
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      Smartphones
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Panel: Find Supplier Products to Link */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                  2
                </span>
                <h3 className="font-semibold text-slate-800 text-sm">
                  Find Supplier Products to Link
                </h3>
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
                {suggestions.length > 0 ? (
                  suggestions.map((item) => (
                    <div key={item.id} className={`border rounded-xl p-5 transition-all relative overflow-hidden ${
                      item.confidence > 70 ? 'border-emerald-200 bg-emerald-50/40' : 
                      item.confidence > 30 ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200 bg-white'
                    }`}>
                    {/* Badge з відсотком схожості */}
                    <div className={`absolute top-0 right-0 text-[10px] font-bold px-3 py-1 rounded-bl-lg border-b border-l uppercase tracking-wide ${
                      item.confidence > 70 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                      item.confidence > 30 ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {item.confidence}% Match
                    </div>

                      <div className="flex items-start gap-5">
                        <div className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-xs font-bold text-slate-400">
                            IMG
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="text-lg font-bold text-slate-900">
                              {item.originalName}
                            </h5>
                            <span className="text-emerald-600 font-bold text-lg">
                              ${item.price}
                            </span>
                          </div>
                          <div className="flex gap-3 mt-4">
                            <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-colors">
                              <CheckCircle2 className="w-4 h-4" />
                              Link to Main Product
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400 italic">
                    No suggestions found for this item
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductMatching;
