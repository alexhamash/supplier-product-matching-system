import { type FC } from "react"
import { Outlet, NavLink, type NavLinkRenderProps } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Package,
  GitMerge,
  Settings,
  Bell,
  Search,
  Share2,
  Database,
  type LucideIcon,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MainLayoutProps {
  /** Optional class name to append to the root element */
  className?: string
}

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

// ---------------------------------------------------------------------------
// Navigation configuration
// ---------------------------------------------------------------------------

const primaryNavItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/suppliers", label: "Suppliers", icon: Users },
  { to: "/main-products", label: "Main Products", icon: Database },
  { to: "/suppliers-products", label: "Supplier Products", icon: Package },
  { to: "/product-matching", label: "Product Matching", icon: GitMerge },
]

const secondaryNavItems: NavItem[] = [
  { to: "/settings", label: "Settings", icon: Settings },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const navLinkClass = ({ isActive }: NavLinkRenderProps): string =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? "bg-[#EFF6FF] text-[#2563EB]"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  }`

const renderNavItems = (items: NavItem[]): React.ReactElement[] =>
  items.map(({ to, label, icon: Icon }) => (
    <NavLink key={to} to={to} end={to === "/"} className={navLinkClass}>
      <Icon className="w-5 h-5" />
      {label}
    </NavLink>
  ))

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MainLayout: FC<MainLayoutProps> = ({ className }) => {
  return (
    <div className={`flex h-screen bg-[#F8FAFC]${className ? ` ${className}` : ""}`}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-full">
        <div>
          {/* Logo */}
          <div className="p-6 flex items-center gap-2">
            <div className="bg-[#2563EB] p-1.5 rounded-lg">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              SyncMatch
            </span>
          </div>

          {/* Navigation */}
          <div className="px-4">
            <p className="text-xs font-semibold text-slate-400 mb-4 px-2 tracking-wider">
              MENU
            </p>
            <nav className="space-y-1">{renderNavItems(primaryNavItems)}</nav>
          </div>
        </div>

        {/* Settings at the bottom */}
        <div className="p-4 border-t border-slate-200">
          {renderNavItems(secondaryNavItems)}
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
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Notifications"
            >
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
  )
}

export default MainLayout
