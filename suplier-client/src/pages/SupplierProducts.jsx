import React, { useEffect, useState } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  AlertTriangle,
  Package,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getSuppliers } from "../services/supplierService"; // Додав імпорт сервісу

const SupplierProducts = () => {
  const { id } = useParams(); // ID Постачальника з URL

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierName, setSupplierName] = useState("Supplier");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  useEffect(() => {
    const allSuppliers = getSuppliers(); // Отримуємо список усіх постачальників [ {id: 1, name: '...'}, {id: 2, ...} ]
    let allProducts = [];

    allSuppliers.forEach((supplier) => {
      const key = `supplier_products_${supplier.id}`;
      const savedData = localStorage.getItem(key);

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (Array.isArray(parsedData)) {
          const productsWithBrand = parsedData.map(item => ({
            ...item,
            supplierName: supplier.name,
          }));
          allProducts = [...allProducts, ...productsWithBrand ]
        }
      }
    });
    setProducts(allProducts);
  }, []); 


  const filteredProducts = products.filter((p) => {
    const nameMatch = (p.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const skuMatch = (p.supplierSku || "").toLowerCase().includes(searchTerm.toLowerCase());

    const currentStatus = (p.status || "unmatched").toLowerCase();
    const targetFilter = statusFilter.toLowerCase();

    const statusMatch =
      statusFilter === "All Statuses" ||
      currentStatus === targetFilter

    return (nameMatch || skuMatch) && statusMatch
  })
    
  const navigate = useNavigate()

  return (
    <div className="w-full">
      {/* Header section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-1">
            Supplier Products 
          </h1>
          <p className="text-[#64748B] text-[15px]">
            View imported inventory and their matches to your main catalog.
          </p>
        </div>
        <button className="bg-[#3B82F6] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          Go to Matching Tool
          <ArrowRight className="w-4 h-4" />
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or SKU..."
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto ml-auto">
          <div className="text-slate-400 hidden sm:block">
            <Filter className="w-4 h-4" />
          </div>

          <div className="relative w-full sm:w-[160px]">
            <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm appearance-none bg-white cursor-pointer text-slate-700">
              <option>All Statuses</option>
              <option>Matched</option>
              <option>Unmatched</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8 shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Supplier Product
          </div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Supplier
          </div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Match Status
          </div>
          <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Linked Main Product
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-100">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center"
            >
              {/* 1. Product Info */}
              <div className="col-span-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 text-slate-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">
                    {product.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-mono uppercase">
                    SKU: {product.supplierSku}
                  </p>
                </div>
              </div>

              {/* 2. Supplier Tag */}
              <div className="col-span-2">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100">
                  {product.supplierName}
                </span>
              </div>

              {/* 3. Status */}
              <div className="col-span-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">
                  Unmatched
                </span>
              </div>

              {/* 4. Action / Link */}
              <div className="col-span-4">
                <button 
                onClick={() => navigate(`/matching?supplierProductId=${products.id}`)}
                className="w-full text-center py-2 px-3 border border-slate-300 border-dashed rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-colors font-medium">
                  Find Match
                </button> 
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="p-20 text-center border-t border-slate-100">
              <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No products found</p>
              <p className="text-slate-400 text-sm mt-1">
                Try to run Synchronize again or check your search query.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default SupplierProducts;
