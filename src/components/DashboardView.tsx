import React from 'react';
import { InventoryItem, ActivityLog, InventoryCategory, PurchaseOrderItem, PurchaseOrderStatus } from '../types';
import {
  Monitor,
  Network,
  Tv,
  BedDouble,
  Plus,
  ArrowRight,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Edit3,
  Barcode,
  ClipboardList,
  Truck,
  Boxes,
  Building,
} from 'lucide-react';

interface DashboardViewProps {
  inventory: InventoryItem[];
  purchaseOrders?: PurchaseOrderItem[];
  activities?: ActivityLog[];
  onOpenAddModal: (category?: InventoryCategory) => void;
  onOpenAddPOModal?: () => void;
  onOpenPOStatusModal?: (status: PurchaseOrderStatus) => void;
  onSelectCategory: (category: InventoryCategory) => void;
  onViewItem: (item: InventoryItem) => void;
  onViewPOItem?: (item: PurchaseOrderItem) => void;
  onViewAllInventory: () => void;
  onNavigateToPOs?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  inventory,
  purchaseOrders = [],
  activities,
  onOpenAddModal,
  onOpenAddPOModal,
  onOpenPOStatusModal,
  onSelectCategory,
  onViewItem,
  onViewPOItem,
  onViewAllInventory,
  onNavigateToPOs,
}) => {
  // Statistics calculations - Inventory
  const totalCount = inventory.length;
  const totalUnits = inventory.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  const pcCount = inventory.filter((i) => i.category === 'PC ITEMS').length;
  const networkCount = inventory.filter((i) => i.category === 'NETWORK ITEMS').length;
  const cctvCount = inventory.filter((i) => i.category === 'CCTV & TV ITEMS').length;
  const roomCount = inventory.filter((i) => i.category === 'ROOM ITEMS').length;

  // Added this month based on createdAt
  const currentMonthPrefix = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
  const addedThisMonthCount = inventory.filter((i) =>
    (i.createdAt || '').startsWith(currentMonthPrefix)
  ).length;

  // Statistics calculations - Purchase Orders
  const poTotalCount = purchaseOrders.length;
  const poTotalUnits = purchaseOrders.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  const poPendingCount = purchaseOrders.filter((p) => p.status === 'NOT ARRIVED').length;
  const poPendingUnits = purchaseOrders
    .filter((p) => p.status === 'NOT ARRIVED')
    .reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  const poArrivedCount = purchaseOrders.filter((p) => p.status === 'ARRIVED').length;
  const poArrivedUnits = purchaseOrders
    .filter((p) => p.status === 'ARRIVED')
    .reduce((acc, curr) => acc + (curr.quantity || 1), 0);

  // Unified Recently Edited Feed (Combines Inventory & Purchase Orders per user request)
  type UnifiedRecentItem = {
    feedType: 'INVENTORY' | 'PO';
    id: string;
    itemName: string;
    photoUrl: string;
    subLabel: string; // Category or PO Status
    quantity: number;
    isEdited: boolean;
    editorName: string;
    actionTime: string;
    secondaryDateLabel: string;
    secondaryDateValue: string;
    rawInventory?: InventoryItem;
    rawPO?: PurchaseOrderItem;
  };

  const inventoryFeed: UnifiedRecentItem[] = inventory.map((item) => {
    const isEdited =
      Boolean(item.updatedAt &&
      item.createdAt &&
      new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > 2000);
    return {
      feedType: 'INVENTORY',
      id: item.id,
      itemName: item.itemName,
      photoUrl: item.photoUrl,
      subLabel: item.category,
      quantity: item.quantity || 1,
      isEdited,
      editorName: item.updatedBy || item.createdBy,
      actionTime: item.updatedAt || item.createdAt,
      secondaryDateLabel: 'Dibereskan',
      secondaryDateValue: item.dateRepaired,
      rawInventory: item,
    };
  });

  const poFeed: UnifiedRecentItem[] = purchaseOrders.map((item) => {
    const isEdited =
      Boolean(item.updatedAt &&
      item.createdAt &&
      new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > 2000);
    return {
      feedType: 'PO',
      id: item.id,
      itemName: item.itemName,
      photoUrl: item.photoUrl,
      subLabel: item.status === 'ARRIVED' ? 'PO • SUDAH DATANG' : 'PO • BELUM DATANG',
      quantity: item.quantity || 1,
      isEdited,
      editorName: item.updatedBy || item.createdBy,
      actionTime: item.updatedAt || item.createdAt,
      secondaryDateLabel: 'Tgl Pesan',
      secondaryDateValue: item.orderDate,
      rawPO: item,
    };
  });

  const recentlyEditedUnified: UnifiedRecentItem[] = [...inventoryFeed, ...poFeed]
    .sort((a, b) => new Date(b.actionTime).getTime() - new Date(a.actionTime).getTime())
    .slice(0, 8);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
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
      return `${d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })} • ${d.toLocaleTimeString('id-ID', {
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
      {/* Top Banner & Quick Add Actions */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Central IT Operations & Hardware Depot</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hotel IT Inventory & Procurement Dashboard
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            Sistem terpadu pemantauan inventaris fisik, perbaikan barang, dan pengadaan (Purchase Order) hardware IT hotel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => onOpenAddModal()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-blue-600/30 hover:scale-[1.02] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ ADD INVENTORY</span>
          </button>

          {onOpenAddPOModal && (
            <button
              onClick={onOpenAddPOModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] cursor-pointer shrink-0"
            >
              <Truck className="w-4 h-4" />
              <span>+ ADD PO DATA</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. PURCHASE ORDER STATUS STATS SECTION (CLICKABLE) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-6 bg-indigo-600 rounded-full" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              PURCHASE ORDER STATUS & TRACKING
            </h3>
          </div>
          {onNavigateToPOs && (
            <button
              onClick={onNavigateToPOs}
              className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Purchase Order Data</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Orderan Menunggu Datang (CLICKABLE per user request) */}
          <div
            onClick={() => onOpenPOStatusModal && onOpenPOStatusModal('NOT ARRIVED')}
            className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-amber-400 transition-all cursor-pointer group relative overflow-hidden bg-linear-to-br from-amber-50/40 via-white to-white"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                Klik Lihat Barang <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                ORDERAN MENUNGGU DATANG
              </h4>
              <div className="text-3xl font-black text-amber-950 mt-1">
                {poPendingCount}{' '}
                <span className="text-xs font-semibold text-amber-700">
                  Order ({poPendingUnits} Unit)
                </span>
              </div>
              <p className="text-[11px] text-amber-600 font-medium mt-1">
                Pesanan yang sedang diproses / belum tiba di hotel
              </p>
            </div>
          </div>

          {/* Orderan Sudah Datang (CLICKABLE per user request) */}
          <div
            onClick={() => onOpenPOStatusModal && onOpenPOStatusModal('ARRIVED')}
            className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-emerald-400 transition-all cursor-pointer group relative overflow-hidden bg-linear-to-br from-emerald-50/40 via-white to-white"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                Klik Lihat Barang <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                ORDERAN SUDAH DATANG
              </h4>
              <div className="text-3xl font-black text-emerald-950 mt-1">
                {poArrivedCount}{' '}
                <span className="text-xs font-semibold text-emerald-700">
                  Order ({poArrivedUnits} Unit)
                </span>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                Barang yang telah diterima secara fisik oleh tim IT
              </p>
            </div>
          </div>

          {/* Total PO Summary Card */}
          <div
            onClick={onNavigateToPOs}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <ClipboardList className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Kelola PO <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                TOTAL PO RECORD
              </h4>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {poTotalCount}{' '}
                <span className="text-xs font-semibold text-slate-500">
                  Order ({poTotalUnits} Unit)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Total keseluruhan data transaksi pengadaan IT
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. RECENTLY EDITED SECTION (UNIFIED: INVENTORY + PURCHASE ORDERS) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-6 bg-blue-600 rounded-full" />
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                RECENTLY EDITED
              </h3>
              <p className="text-xs text-slate-400">
                Aktivitas terbaru inventaris dan purchase order (termasuk diedit oleh user)
              </p>
            </div>
          </div>
          <button
            onClick={onViewAllInventory}
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua Inventaris</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentlyEditedUnified.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
            Belum ada aktivitas barang yang baru diedit atau ditambahkan.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentlyEditedUnified.map((item) => {
              const isPO = item.feedType === 'PO';
              const statusBadgeText = item.isEdited ? 'Edited' : 'Added';

              return (
                <div
                  key={`${item.feedType}-${item.id}`}
                  onClick={() => {
                    if (isPO && item.rawPO && onViewPOItem) {
                      onViewPOItem(item.rawPO);
                    } else if (item.rawInventory) {
                      onViewItem(item.rawInventory);
                    }
                  }}
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

                      {/* Type Badge (INVENTORY / PO) */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide shadow-xs ${
                            isPO
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-900 text-white'
                          }`}
                        >
                          {isPO ? 'PURCHASE ORDER' : 'INVENTORY'}
                        </span>

                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide shadow-xs ${
                            item.isEdited
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {statusBadgeText}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider ${
                            isPO ? 'text-indigo-600' : 'text-blue-600'
                          }`}
                        >
                          {item.subLabel}
                        </span>
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                          {item.quantity} Unit
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors mt-0.5">
                        {item.itemName}
                      </h4>
                    </div>

                    <div className="space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {item.secondaryDateLabel}: {formatDate(item.secondaryDateValue)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Audit footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-700 font-semibold">
                        {statusBadgeText} by:{' '}
                        <span className="text-blue-700 font-bold">{item.editorName}</span>
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDateTime(item.actionTime)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. CATEGORY DASHBOARD CARDS (INVENTORY CATEGORIES) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-slate-900 rounded-full" />
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            CATEGORY DASHBOARD
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* PC ITEMS */}
          <div
            onClick={() => onSelectCategory('PC ITEMS')}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
                <Monitor className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                PC ITEMS
              </h4>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {pcCount} <span className="text-xs font-medium text-slate-500">ITEMS</span>
              </div>
            </div>
          </div>

          {/* NETWORK ITEMS */}
          <div
            onClick={() => onSelectCategory('NETWORK ITEMS')}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                <Network className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                NETWORK ITEMS
              </h4>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {networkCount} <span className="text-xs font-medium text-slate-500">ITEMS</span>
              </div>
            </div>
          </div>

          {/* CCTV & TV ITEMS */}
          <div
            onClick={() => onSelectCategory('CCTV & TV ITEMS')}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-purple-500 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-xs">
                <Tv className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                CCTV & TV ITEMS
              </h4>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {cctvCount} <span className="text-xs font-medium text-slate-500">ITEMS</span>
              </div>
            </div>
          </div>

          {/* ROOM ITEMS */}
          <div
            onClick={() => onSelectCategory('ROOM ITEMS')}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-amber-500 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-xs">
                <BedDouble className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                ROOM ITEMS
              </h4>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {roomCount} <span className="text-xs font-medium text-slate-500">ITEMS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INVENTORY SUMMARY & METRICS */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h4 className="text-base font-bold text-slate-900">Inventory Summary & Metrics</h4>
          </div>
          <span className="text-xs font-semibold text-slate-400">Department Overview</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">TOTAL TYPES</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</div>
            <div className="text-[10px] text-blue-600 font-bold mt-0.5">{totalUnits} Physical Units</div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/70 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">PC ITEMS</span>
            <div className="text-2xl font-extrabold text-blue-900 mt-1">{pcCount}</div>
            <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Desktop & POS</div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/70 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">NETWORK</span>
            <div className="text-2xl font-extrabold text-emerald-900 mt-1">{networkCount}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Switches & APs</div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200/70 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">CCTV & TV</span>
            <div className="text-2xl font-extrabold text-purple-900 mt-1">{cctvCount}</div>
            <div className="text-[10px] text-purple-600 font-semibold mt-0.5">Surveillance & TVs</div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">ROOM ITEMS</span>
            <div className="text-2xl font-extrabold text-amber-900 mt-1">{roomCount}</div>
            <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Locks & IP Phones</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">THIS MONTH</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{addedThisMonthCount}</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Recent Additions</div>
          </div>
        </div>
      </section>
    </div>
  );
};
