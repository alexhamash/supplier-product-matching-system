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
import toast from "react-hot-toast";
import {
  createMatch,
  getSupplierSuggestions,
} from "../services/matchingService";

import { useSearchParams } from "react-router-dom";


const ProductMatching = () => {
  const [mainProducts, setMainProducts] = useState([]);
  const [activeItem, setActiveItem] = useState(0);
  const [allSupplierProducts, setAllSupplierProducts] = useState([]);

  const [showLinked, setShowLinked] = useState(false);

  const [searchTerm, setSearchTearm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const [searchParams] = useSearchParams();
  const targetSupplierId = searchParams.get("supplierProductId")
  

  useEffect(() => {
    const data = getMainProducts();
    setMainProducts(data);

    const existingSData = getSupplierProducts(1);
    if (existingSData && existingSData.length > 0) {
      setAllSupplierProducts(existingSData);
    } else {
      importSupplierData(1).then(() => {
        const sData = getSupplierProducts(1);
        setAllSupplierProducts(sData);
      });
    }
  }, []);


  const selectedProduct = mainProducts[activeItem] || null;

  // useEffect (() => {
  //   if(selectedProduct) {
  //     const hasLinks = allSupplierProducts.some(
  //       (p) => p.status === "matched" && p.mainProductId === selectedProduct.id
  //     )
  //     setShowLinked(hasLinks)
  //   }
  // }, [selectedProduct?.id])


  const unmatchedProducts = allSupplierProducts.filter(
    (p) => p.status !== "matched",
  );

  const finalItems = !showLinked
    ? getSupplierSuggestions(selectedProduct, unmatchedProducts)
    : allSupplierProducts.filter(
        (p) =>
          p.status === "matched" && p.mainProductId === selectedProduct?.id,
      );
  
  const uniqueSuppliersCount = new Set (
    allSupplierProducts
      .filter(p => p.status === "matched" && p.mainProductId === selectedProduct?.id)
      .map(p => p.supplierId)
  ).size

  const handleLink = (supplierProduct) => {
    if (!selectedProduct) return;

    const sId = supplierProduct.supplierId || 1;
    createMatch(selectedProduct.id, supplierProduct.id, sId);

    setAllSupplierProducts((prev) =>
      prev.map((p) =>
        p.id === supplierProduct.id
          ? { ...p, status: "matched", mainProductId: selectedProduct.id }
          : p,
      ),
    );

    setMainProducts((prev) => {
      const updated = prev.map((p) =>
        p.id === selectedProduct.id
          ? { ...p, linkedCount: (p.linkedCount || 0) + 1 }
          : p,
      );
      localStorage.setItem("main_products", JSON.stringify(updated));
      return updated;
    });

    toast.success(`Зв'язано: ${supplierProduct.name}`, {
      duration: 4000,
      style: {
        border: "1px solid #10B981",
        padding: "16px",
        color: "#064E3B",
        background: "#ECFDF5",
        fontWeight: "600",
        borderRadius: "12px",
      },
      iconTheme: {
        primary: "#10B981",
        secondary: "#FFFAEE",
      },
    });
  };

  const handleUnlink = (supplierProduct) => {
  createMatch(null, supplierProduct.id, supplierProduct.supplierId || 1);

  setAllSupplierProducts(prev => prev.map(p =>
    p.id === supplierProduct.id ? { ...p, status: "unmatched", mainProductId: null } : p
  ));

  setMainProducts(prev => {
    const updated = prev.map(p => 
      p.id === selectedProduct.id ? { ...p, linkedCount: Math.max(0, (p.linkedCount || 0) - 1) } : p
    );
    localStorage.setItem("main_products", JSON.stringify(updated));
    return updated;
  });

  toast.error(`Зв'язок розірвано: ${supplierProduct.name}`);
};




  const filteredMainProducts = mainProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.SKU.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all"
      ? true
      : filterStatus === "linked"
        ? product.linkedCount > 0
        : (product.linkedCount || 0) === 0

    return matchesSearch && matchesStatus
   })

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
                value={searchTerm}
                onChange={(e) => setSearchTearm(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-slate-50"
              />
            </div>
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg">
              {['all', 'unlinked', 'linked'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`flex-1 text-[10px] uppercase tracking-wider font-bold py-1.5 rounded-md transition-all ${
                    filterStatus === status 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  {status === 'all' ? 'All' : status === 'unlinked' ? 'Unlinked' : 'Linked'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
            {filteredMainProducts.map((item, index) => (
              <div
                key={item.id}
                onClick={() => setActiveItem(index)}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                  activeItem === index
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-transparent"
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
                    {item.linkedCount || 0} Linked
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
                   {uniqueSuppliersCount} Suppliers Currently Linked
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

              <button
                onClick={() => setShowLinked(!showLinked)}
                className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200
              ${
                showLinked
                  ? "bg-amber-100 text-amber-800 border-amber-300 shadow-inner"
                  : "bg-white text-indigo-600 border-slate-200 hover:bg-slate-50 hover:border-indigo-300 shadow-sm"
              }`}
              >
                <Layers
                  className={`w-4 h-4 ${showLinked ? "text-amber-500" : "text-indigo-500"}`}
                />
                {showLinked ? "View Suggestions" : "View Currently Linked"}
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
                {showLinked ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Currently Linked Supplier Products
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    AI Suggested Supplier Products
                  </>
                )}
              </h4>

              <div className="space-y-4">
                {finalItems.length > 0 ? (
                  finalItems.map((item) => (
                    <div
                      key={item.id}
                      className={`border rounded-xl p-5 transition-all relative overflow-hidden ${
                        item.confidence > 70
                          ? "border-emerald-200 bg-emerald-50/40"
                          : item.confidence > 30
                            ? "border-amber-200 bg-amber-50/40"
                            : "border-slate-200 bg-white"
                      }`}
                    >
                      {/* Badge з відсотком схожості */}
                      <div>
                        {showLinked ? (
                        <div className="absolute top-0 right-0 text-[10px] font-bold px-3 py-1 rounded-bl-lg bg-emerald-50 text-emerald-700 border-l border-b border-emerald-100 uppercase tracking-wide">
                          Currently Linked
                        </div>
                      ) : (
                        <div className={`absolute top-0 right-0 text-[10px] font-bold px-3 py-1 rounded-bl-lg border-b border-l uppercase tracking-wide ${
                          item.confidence > 70 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {item.confidence}% Match
                        </div>
                      )}
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
                              {item.name}
                            </h5>
                            <span className="text-emerald-600 font-bold text-lg">
                              ${item.price}
                            </span>
                          </div>
                          <div className="flex gap-3 mt-4">
                            {showLinked ? (
                            <button 
                              onClick={() => handleUnlink(item)}
                              className="flex-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-all hover:border-rose-300"
                            >
                              <XCircle className="w-4 h-4" />
                              Unlink from Product
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleLink(item)}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-all"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Link to Main Product
                            </button>
                          )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400 italic">
                    {!showLinked
                      ? "No suggestions found for this item"
                      : "No products linked to this item yet"}
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
