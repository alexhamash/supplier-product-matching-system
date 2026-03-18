import React from 'react';
import { TrendingUp, Users, Package, GitMerge, MoreHorizontal, ArrowUpRight } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-1">Dashboard</h1>
        <p className="text-[#64748B] text-[15px]">Overview of your inventory and matching progress.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-50 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total Suppliers</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-bold text-slate-900">12</h3>
              <span className="flex items-center text-emerald-600 text-sm font-medium mb-1">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                2
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-50 p-3 rounded-xl">
              <Package className="w-6 h-6 text-indigo-600" />
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total Products</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-bold text-slate-900">8,459</h3>
              <span className="flex items-center text-emerald-600 text-sm font-medium mb-1">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                124
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-50 p-3 rounded-xl">
              <GitMerge className="w-6 h-6 text-emerald-600" />
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Matched Products</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-bold text-slate-900">5,120</h3>
              <span className="flex items-center text-slate-400 text-sm font-medium mb-1">
                60.5%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-amber-50 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Pending Matches</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-bold text-slate-900">3,339</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          <button className="text-blue-600 text-sm font-medium hover:text-blue-700">View All</button>
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <GitMerge className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Auto-matched 45 products</p>
                  <p className="text-xs text-slate-500">Supplier: TechCorp Inc.</p>
                </div>
              </div>
              <span className="text-xs text-slate-400">{i * 2} hours ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
