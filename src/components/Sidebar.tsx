import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  Monitor,
  Network,
  Tv,
  CalendarDays,
  FileSpreadsheet,
  Users,
  Settings,
  LogOut,
  X,
  Hotel,
} from 'lucide-react';
import { InventoryCategory } from '../types';

export type NavTab =
  | 'dashboard'
  | 'inventory'
  | 'pc-items'
  | 'network-items'
  | 'cctv-items'
  | 'monthly-data'
  | 'export-data'
  | 'user-management'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab, categoryFilter?: InventoryCategory) => void;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  categoryCounts?: {
    pc: number;
    network: number;
    cctv: number;
    total: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  isOpenMobile,
  onCloseMobile,
  categoryCounts = { pc: 0, network: 0, cctv: 0, total: 0 },
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'inventory' as NavTab,
      label: 'Inventory',
      icon: Boxes,
      badge: categoryCounts.total,
    },
    {
      id: 'pc-items' as NavTab,
      label: 'PC Items',
      icon: Monitor,
      badge: categoryCounts.pc,
      categoryFilter: 'PC ITEMS' as InventoryCategory,
    },
    {
      id: 'network-items' as NavTab,
      label: 'Network Items',
      icon: Network,
      badge: categoryCounts.network,
      categoryFilter: 'NETWORK ITEMS' as InventoryCategory,
    },
    {
      id: 'cctv-items' as NavTab,
      label: 'CCTV & TV Items',
      icon: Tv,
      badge: categoryCounts.cctv,
      categoryFilter: 'CCTV & TV ITEMS' as InventoryCategory,
    },
    {
      id: 'monthly-data' as NavTab,
      label: 'Monthly Data',
      icon: CalendarDays,
      badge: null,
    },
    {
      id: 'export-data' as NavTab,
      label: 'Export Data',
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      id: 'user-management' as NavTab,
      label: 'User Management',
      icon: Users,
      badge: 'Protected',
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      {/* Brand header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
            <Hotel className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-base tracking-wide">HOTEL IT</div>
            <div className="text-[11px] text-slate-400 font-medium">INVENTORY DEPT</div>
          </div>
        </div>

        {/* Close button for mobile */}
        {isOpenMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu Navigation
        </div>

        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id, item.categoryFilter);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge !== null && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white font-bold'
                      : typeof item.badge === 'string'
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50 text-[10px]'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer info & Logout */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="bg-slate-800/50 rounded-lg p-3 text-[11px] text-slate-400 border border-slate-800">
          <div className="font-semibold text-slate-200">System Mode</div>
          <div className="text-emerald-400 flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Online & Persistent
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/50 border border-red-900/40 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 h-screen sticky top-0 border-r border-slate-800 z-20">
        {content}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
