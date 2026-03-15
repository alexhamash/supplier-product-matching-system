import React from 'react';
import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  GitMerge,
  Settings,
  Bell,
  Search,
  Share2
} from "lucide-react";

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-full">
        <div>
          {/* Logo */}
          <div className="p-6 flex items-center gap-2">
            <div className="bg-[#2563EB] p-1.5 rounded-lg">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">SyncMatch</span>
          </div>

          {/* Navigation */}
          <div className="px-4">
            <p className="text-xs font-semibold text-slate-400 mb-4 px-2 tracking-wider">MENU</p>
            <nav className="space-y-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </NavLink>
              <NavLink
                to="/suppliers"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Users className="w-5 h-5" />
                Suppliers
              </NavLink>
              <NavLink
                to="/supplier-products"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Package className="w-5 h-5" />
                Supplier Products
              </NavLink>
              <NavLink
                to="/product-matching"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <GitMerge className="w-5 h-5" />
                Product Matching
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Settings at the bottom */}
        <div className="p-4 border-t border-slate-200">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            Settings
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="flex-1 max-w-xl relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search anything..."
              className="block w-full pl-10 pr-3 py-2 border-none bg-slate-50 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200 focus:bg-white transition-colors"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-[#818CF8] text-white flex items-center justify-center text-sm font-medium">
              JD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
