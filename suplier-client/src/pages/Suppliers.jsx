import React from 'react';
import { Search, Plus, MoreVertical, Link as LinkIcon, FileSpreadsheet, RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";

const Suppliers = () => {
  return (
    <div className="w-full max-w-6xl mx-auto pb-12">
      {/* Header section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-1">Suppliers & Catalogs</h1>
          <p className="text-[#64748B] text-[15px]">Manage your connected suppliers and import their product catalogs via spreadsheets.</p>
        </div>
        <button className="bg-[#3B82F6] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Connect New Supplier
        </button>
      </div>

      {/* Filter section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex items-center shadow-sm">
        <div className="relative flex-1 max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search suppliers by name..."
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200 focus:border-slate-300 transition-colors bg-slate-50/50"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier Name</div>
          <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Catalog Source</div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Products</div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sync Status</div>
          <div className="col-span-1 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</div>
        </div>

        <div className="divide-y divide-slate-100">
          {/* Supplier 1 */}
          <div className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-50/50 transition-colors group">
            <div className="col-span-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 font-bold text-base flex items-center justify-center border border-blue-100 flex-shrink-0">
                T
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">TechCorp Inc.</p>
                <p className="text-xs text-slate-500">ID: SUP-1001</p>
              </div>
            </div>

            <div className="col-span-4">
               <div className="flex items-center gap-2 mb-1">
                 <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                 <span className="text-sm font-medium text-slate-700">Google Sheets Link</span>
               </div>
               <a href="#" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors truncate w-full pr-4">
                 <LinkIcon className="w-3 h-3" />
                 docs.google.com/spreadsheets/d/1BxiMVs0X...
               </a>
            </div>

            <div className="col-span-2">
              <p className="text-sm font-semibold text-slate-800">1,240</p>
              <p className="text-xs text-slate-500">Imported</p>
            </div>

            <div className="col-span-2">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700">Synced</span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                2 hours ago
              </p>
            </div>

            <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sync Now">
                 <RefreshCw className="w-4 h-4" />
               </button>
               <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                 <MoreVertical className="w-4 h-4" />
               </button>
            </div>
          </div>

          {/* Supplier 2 */}
          <div className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-50/50 transition-colors group">
            <div className="col-span-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-base flex items-center justify-center border border-indigo-100 flex-shrink-0">
                G
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Global Supply Co.</p>
                <p className="text-xs text-slate-500">ID: SUP-1002</p>
              </div>
            </div>

            <div className="col-span-4">
               <div className="flex items-center gap-2 mb-1">
                 <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                 <span className="text-sm font-medium text-slate-700">Excel Upload</span>
               </div>
               <span className="text-xs text-slate-500 truncate w-full pr-4 block">
                 global_catalog_2023_v2.xlsx
               </span>
            </div>

            <div className="col-span-2">
              <p className="text-sm font-semibold text-slate-800">850</p>
              <p className="text-xs text-slate-500">Imported</p>
            </div>

            <div className="col-span-2">
              <div className="flex items-center gap-1.5 mb-1">
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-sm font-medium text-blue-700">Syncing...</span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Started 2m ago
              </p>
            </div>

            <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                 <MoreVertical className="w-4 h-4" />
               </button>
            </div>
          </div>

          {/* Supplier 3 */}
          <div className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-50/50 transition-colors group">
            <div className="col-span-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 font-bold text-base flex items-center justify-center border border-red-100 flex-shrink-0">
                A
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Accessories Pro</p>
                <p className="text-xs text-slate-500">ID: SUP-1003</p>
              </div>
            </div>

            <div className="col-span-4">
               <div className="flex items-center gap-2 mb-1">
                 <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                 <span className="text-sm font-medium text-slate-700">Google Sheets Link</span>
               </div>
               <a href="#" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors truncate w-full pr-4">
                 <LinkIcon className="w-3 h-3" />
                 docs.google.com/spreadsheets/d/9Ax...
               </a>
            </div>

            <div className="col-span-2">
              <p className="text-sm font-semibold text-slate-800">95</p>
              <p className="text-xs text-slate-500">Last known</p>
            </div>

            <div className="col-span-2">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">Sync Failed</span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                Permission denied
              </p>
            </div>

            <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Retry Sync">
                 <RefreshCw className="w-4 h-4" />
               </button>
               <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                 <MoreVertical className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Information Panel */}
      <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">How importing works</h3>
        <p className="text-sm text-blue-800/80 leading-relaxed max-w-3xl">
          The system imports supplier products directly from their spreadsheets. When a supplier updates their Google Sheet or you upload a new Excel file, the catalog syncs automatically. These imported items will appear in the <strong>Supplier Products</strong> section, waiting to be linked to your store's main internal catalog in the <strong>Product Matching</strong> tool.
        </p>
      </div>
    </div>
  );
}

export default Suppliers;
