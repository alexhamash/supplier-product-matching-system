import React from 'react';
import { Search, Plus, MoreVertical, Edit, Trash2 } from "lucide-react";

const Suppliers = () => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-1">Suppliers</h1>
          <p className="text-[#64748B] text-[15px]">Manage your connected suppliers and their product catalogs.</p>
        </div>
        <button className="bg-[#3B82F6] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* Filter section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex items-center">
        <div className="relative flex-1 max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search suppliers by name or ID..."
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200 focus:border-slate-300 transition-colors"
          />
        </div>
      </div>

      {/* Data list/grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sample Supplier Cards */}
        {[
          { name: "TechCorp Inc.", products: 1240, status: "Active", lastSync: "2 hours ago" },
          { name: "Global Supply Co.", products: 850, status: "Active", lastSync: "5 hours ago" },
          { name: "Electronics Direct", products: 432, status: "Pending", lastSync: "1 day ago" },
          { name: "Accessories Pro", products: 95, status: "Error", lastSync: "3 days ago" },
        ].map((supplier, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
            <button className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              <MoreVertical className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 font-bold text-lg flex items-center justify-center border border-blue-100">
                {supplier.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{supplier.name}</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                  supplier.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                  supplier.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {supplier.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wide">Products</p>
                <p className="text-base font-semibold text-slate-800">{supplier.products}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wide">Last Sync</p>
                <p className="text-sm font-medium text-slate-600">{supplier.lastSync}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Card */}
        <button className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50/50 transition-all group h-full min-h-[220px]">
          <div className="bg-slate-50 p-3 rounded-full group-hover:bg-white mb-3 shadow-sm group-hover:shadow transition-all">
            <Plus className="w-6 h-6" />
          </div>
          <p className="font-semibold text-sm">Add New Supplier</p>
        </button>
      </div>
    </div>
  );
}

export default Suppliers;
