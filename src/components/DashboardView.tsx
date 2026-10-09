import React from 'react';
import { InventoryItem, ActivityLog, InventoryCategory } from '../types';
import {
  Monitor,
  Network,
  Tv,
  Plus,
  ArrowRight,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  History,
  CheckCircle,
  Edit3,
  Barcode,
} from 'lucide-react';

interface DashboardViewProps {
  inventory: InventoryItem[];
  activities: ActivityLog[];
  onOpenAddModal: (category?: InventoryCategory) => void;
  onSelectCategory: (category: InventoryCategory) => void;
  onViewItem: (item: InventoryItem) => void;
  onViewAllInventory: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  inventory,
  activities,
  onOpenAddModal,
  onSelectCategory,
  onViewItem,
  onViewAllInventory,
}) => {
  // Statistics calculations
  const totalCount = inventory.length;
  const totalUnits = inventory.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  const pcCount = inventory.filter((i) => i.category === 'PC ITEMS').length;
  const networkCount = inventory.filter((i) => i.category === 'NETWORK ITEMS').length;
  const cctvCount = inventory.filter((i) => i.category === 'CCTV & TV ITEMS').length;

  // Added this month based on createdAt
  const currentMonthPrefix = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
  const addedThisMonthCount = inventory.filter((i) =>
    (i.createdAt || '').startsWith(currentMonthPrefix)
  ).length;

  // Recently Edited (top 8 items sorted by updatedAt or createdAt)
  const recentlyEdited = [...inventory]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 8);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })} • ${d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner & Quick Add */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Central IT Operations & Hardware Depot</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hotel IT Inventory Dashboard
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            Real-time tracking of used, repaired, returned, and reconditioned hotel IT assets across all departments.
          </p>
        </div>

        <button
          onClick={() => onOpenAddModal()}
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 hover:scale-[1.02] cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>+ ADD DATA</span>
        </button>
      </div>

      {/* 6. RECENTLY EDITED SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-6 bg-blue-600 rounded-full" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              RECENTLY EDITED
            </h3>
          </div>
          <button
            onClick={onViewAllInventory}
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentlyEdited.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
            No recently edited items yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentlyEdited.map((item) => {
              const isEdited =
                item.updatedAt &&
                item.createdAt &&
                new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > 2000;
              const statusLabel = isEdited ? 'Edited' : 'Added';
              const editorName = item.updatedBy || item.createdBy;

              return (
                <div
                  key={item.id}
                  onClick={() => onViewItem(item)}
                  className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Thumbnail & Badges */}
                    <div className="relative h-36 w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                      <img
                        src={item.photoUrl}
                        alt={item.itemName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide shadow-xs ${
                            isEdited
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                          {item.quantity || 1} Unit
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors mt-0.5">
                        {item.itemName}
                      </h4>
                    </div>

                    <div className="space-y-1 text-xs text-slate-500">
                      {item.serialNumber && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                          <Barcode className="w-3.5 h-3.5 text-slate-400" />
                          <span>SN: {item.serialNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Dibereskan: {formatDate(item.dateRepaired)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Audit footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-700 font-semibold">
                        {statusLabel} by: <span className="text-blue-700 font-bold">{editorName}</span>
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDateTime(item.updatedAt || item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 7. CATEGORY DASHBOARD CARDS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-slate-900 rounded-full" />
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            CATEGORY DASHBOARD
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* PC ITEMS */}
          <div
            onClick={() => onSelectCategory('PC ITEMS')}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
                <Monitor className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View Items <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-5">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                PC ITEMS
              </h4>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">
                {pcCount} <span className="text-sm font-medium text-slate-500">ITEMS</span>
              </div>
            </div>
          </div>

          {/* NETWORK ITEMS */}
          <div
            onClick={() => onSelectCategory('NETWORK ITEMS')}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                <Network className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View Items <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-5">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                NETWORK ITEMS
              </h4>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">
                {networkCount} <span className="text-sm font-medium text-slate-500">ITEMS</span>
              </div>
            </div>
          </div>

          {/* CCTV & TV ITEMS */}
          <div
            onClick={() => onSelectCategory('CCTV & TV ITEMS')}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:border-purple-500 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-xs">
                <Tv className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View Items <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-5">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                CCTV & TV ITEMS
              </h4>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">
                {cctvCount} <span className="text-sm font-medium text-slate-500">ITEMS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 21. DASHBOARD STATISTICS & 22. RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Overview */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h4 className="text-base font-bold text-slate-900">Inventory Summary</h4>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-600 block">TOTAL INVENTORY</span>
                <span className="text-[10px] text-blue-600 font-bold">{totalUnits} Total Units</span>
              </div>
              <span className="text-xl font-extrabold text-slate-900">{totalCount} Types</span>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-800">PC ITEMS</span>
              <span className="text-lg font-bold text-blue-900">{pcCount}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">NETWORK ITEMS</span>
              <span className="text-lg font-bold text-emerald-900">{networkCount}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-800">CCTV & TV</span>
              <span className="text-lg font-bold text-purple-900">{cctvCount}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800">ADDED THIS MONTH</span>
              <span className="text-lg font-bold text-amber-900">{addedThisMonthCount}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-700" />
              <h4 className="text-base font-bold text-slate-900">Recent Activity</h4>
            </div>
            <span className="text-xs text-slate-400">Live Audit Trail</span>
          </div>

          {activities.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No logged activities yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[310px] overflow-y-auto pr-1 space-y-2">
              {activities.slice(0, 7).map((act) => {
                const isAdd = act.action === 'ADD';
                const isEdit = act.action === 'EDIT';
                const actionColor = isAdd
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : isEdit
                  ? 'text-blue-700 bg-blue-50 border-blue-200'
                  : 'text-red-700 bg-red-50 border-red-200';

                return (
                  <div key={act.id} className="pt-2 flex items-start gap-3">
                    <div
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0 mt-0.5 ${actionColor}`}
                    >
                      {act.action}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-800 font-medium">
                        <span className="font-bold text-slate-900">{act.performedBy}</span>{' '}
                        {act.action === 'ADD'
                          ? 'added'
                          : act.action === 'EDIT'
                          ? 'edited'
                          : 'deleted'}{' '}
                        <span className="font-semibold text-slate-900">"{act.itemName}"</span>
                      </p>
                      {act.details && (
                        <p className="text-[11px] text-slate-500 truncate">{act.details}</p>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(act.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
