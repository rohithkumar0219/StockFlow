import React from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  Settings, 
  ExternalLink, 
  Plus, 
  LogOut, 
  Building2, 
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';

export default function Navbar({ 
  user, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  onOpenAddModal 
}) {
  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* Left: Brand & Organization Context */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900 leading-tight text-base tracking-tight">StockFlow</span>
              <span className="text-[10px] uppercase font-mono font-medium text-blue-600 tracking-wider">MVP v0.1</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-gray-200">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
              <Building2 className="w-3.5 h-3.5 text-gray-500" />
              <span className="font-semibold truncate max-w-[160px]">{user?.organization?.name || 'Organization'}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>FastAPI Connected</span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'products'
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Products</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Right: Quick Action & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Product</span>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">{user?.full_name || user?.email}</span>
              <span className="text-[10px] text-gray-500 font-mono capitalize">{user?.role || 'Owner'}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
