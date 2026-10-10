import React, { useState, useMemo } from 'react';
import { PurchaseOrderItem, PurchaseOrderStatus } from '../types';
import {
  ClipboardList,
  Plus,
  FileSpreadsheet,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Calendar,
  Building,
  Eye,
  Edit2,
  Trash2,
  ArrowRight,
  Boxes,
  Truck,
  CheckCheck,
  ChevronDown,
} from 'lucide-react';

interface PurchaseOrdersViewProps {
  purchaseOrders: PurchaseOrderItem[];
  onOpenAddModal: () => void;
  onViewItem: (item: PurchaseOrderItem) => void;
  onEditItem: (item: PurchaseOrderItem) => void;
  onDeleteItem: (item: PurchaseOrderItem) => void;
  onToggleStatus: (item: PurchaseOrderItem) => void;
  onViewPhoto: (photoUrl: string, title: string) => void;
  onExportExcel: (items: PurchaseOrderItem[]) => void;
  initialStatusFilter?: PurchaseOrderStatus | 'ALL';
}

export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({
  purchaseOrders,
  onOpenAddModal,
  onViewItem,
  onEditItem,
  onDeleteItem,
  onToggleStatus,
  onViewPhoto,
  onExportExcel,
  initialStatusFilter = 'ALL',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'ALL'>(initialStatusFilter);
  const [monthFilter, setMonthFilter] = useState<string>('ALL'); // 'ALL' or 'YYYY-MM'
  const [sortField, setSortField] = useState<'orderDate' | 'arrivalDate' | 'itemName' | 'quantity' | 'status' | 'updatedAt'>('orderDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Available months from purchase orders
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    purchaseOrders.forEach((item) => {
      if (item.orderDate && item.orderDate.length >= 7) {
        set.add(item.orderDate.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [purchaseOrders]);

  // Statistics
  const totalCount = purchaseOrders.length;
  const totalUnits = purchaseOrders.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  const notArrivedCount = purchaseOrders.filter((p) => p.status === 'NOT ARRIVED').length;
  const notArrivedUnits = purchaseOrders
    .filter((p) => p.status === 'NOT ARRIVED')
    .reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  const arrivedCount = purchaseOrders.filter((p) => p.status === 'ARRIVED').length;
  const arrivedUnits = purchaseOrders
    .filter((p) => p.status === 'ARRIVED')
    .reduce((acc, curr) => acc + (curr.quantity || 1), 0);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    return purchaseOrders
      .filter((item) => {
        // Status filter
        if (statusFilter !== 'ALL' && item.status !== statusFilter) {
          return false;
        }

        // Month filter
        if (monthFilter !== 'ALL' && !(item.orderDate || '').startsWith(monthFilter)) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.itemName.toLowerCase().includes(q);
          const matchForUse = (item.forUse || '').toLowerCase().includes(q);
          const matchRemarks = (item.remarks || '').toLowerCase().includes(q);
          const matchCreator = (item.createdBy || '').toLowerCase().includes(q);
          const matchEditor = (item.updatedBy || '').toLowerCase().includes(q);
          if (!matchName && !matchForUse && !matchRemarks && !matchCreator && !matchEditor) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'itemName':
            comparison = a.itemName.localeCompare(b.itemName);
            break;
          case 'quantity':
            comparison = (a.quantity || 1) - (b.quantity || 1);
            break;
          case 'orderDate':
            comparison = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
            break;
          case 'arrivalDate':
            const timeA = a.arrivalDate ? new Date(a.arrivalDate).getTime() : 0;
            const timeB = b.arrivalDate ? new Date(b.arrivalDate).getTime() : 0;
            comparison = timeA - timeB;
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
          case 'updatedAt':
            comparison = new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime();
            break;
          default:
            comparison = 0;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [purchaseOrders, statusFilter, monthFilter, searchQuery, sortField, sortOrder]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Actions Bar */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 sm:p-7 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Procurement & Incoming Hardware Tracking</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Purchase Order Data
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Pencatatan dan pemantauan status pesanan pengadaan hardware IT hotel, mulai dari pemesanan hingga kedatangan fisik unit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onExportExcel(filteredItems)}
            className="inline-flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-700/30 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>EXPORT EXCEL</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-blue-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ ADD DATA</span>
          </button>
        </div>
      </div>

      {/* Interactive Status & Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Orders Card */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            statusFilter === 'ALL'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Orderan
            </span>
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalCount}</span>
            <span className="text-xs font-bold text-blue-600">({totalUnits} Unit)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Seluruh data pesanan barang IT</p>
        </div>

        {/* Status: Menunggu Datang Card (Interactive) */}
        <div
          onClick={() => setStatusFilter('NOT ARRIVED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            statusFilter === 'NOT ARRIVED'
              ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-amber-400 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Orderan Menunggu Datang
              </span>
            </div>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-900">{notArrivedCount}</span>
            <span className="text-xs font-bold text-amber-700">({notArrivedUnits} Unit)</span>
          </div>
          <p className="text-[11px] text-amber-700/80 mt-1 flex items-center justify-between">
            <span>Klik untuk filter pesanan tertunda</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </p>
        </div>

        {/* Status: Sudah Datang Card (Interactive) */}
        <div
          onClick={() => setStatusFilter('ARRIVED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            statusFilter === 'ARRIVED'
              ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-emerald-400 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Orderan Sudah Datang
              </span>
            </div>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-900">{arrivedCount}</span>
            <span className="text-xs font-bold text-emerald-700">({arrivedUnits} Unit)</span>
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1 flex items-center justify-between">
            <span>Klik untuk filter barang yang sudah tiba</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama barang, peruntukan (for use), catatan, atau user..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="ALL">Semua Bulan Order</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  Bulan {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            Filter Status:
          </span>

          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('NOT ARRIVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              statusFilter === 'NOT ARRIVED'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Datang ({notArrivedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('ARRIVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              statusFilter === 'ARRIVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sudah Datang ({arrivedCount})</span>
          </button>

          <span className="ml-auto text-xs text-slate-400 font-medium">
            Menampilkan <strong className="text-slate-700">{filteredItems.length}</strong> data
          </span>
        </div>
      </div>

      {/* Main Table (Desktop) */}
      <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-14">No</th>
                <th className="py-3.5 px-4 w-16">Foto</th>
                <th className="py-3.5 px-4">
                  <button
                    onClick={() => toggleSort('itemName')}
                    className="inline-flex items-center gap-1 hover:text-blue-600 cursor-pointer font-bold"
                  >
                    <span>Nama Barang</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => toggleSort('quantity')}
                    className="inline-flex items-center gap-1 hover:text-blue-600 cursor-pointer font-bold"
                  >
                    <span>Unit</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3.5 px-4">
                  <button
                    onClick={() => toggleSort('orderDate')}
                    className="inline-flex items-center gap-1 hover:text-blue-600 cursor-pointer font-bold"
                  >
                    <span>Date Order</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3.5 px-4">
                  <button
                    onClick={() => toggleSort('arrivalDate')}
                    className="inline-flex items-center gap-1 hover:text-blue-600 cursor-pointer font-bold"
                  >
                    <span>Date Arrival</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3.5 px-4">For Use</th>
                <th className="py-3.5 px-4">Remarks</th>
                <th className="py-3.5 px-4">Added By</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <Truck className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                    <p className="mt-2 font-medium">Tidak ada data orderan yang sesuai kriteria.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isArrived = item.status === 'ARRIVED';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onViewItem(item)}
                    >
                      {/* No */}
                      <td className="py-3 px-4 font-mono text-slate-400 text-center">
                        {idx + 1}
                      </td>

                      {/* Photo Thumbnail */}
                      <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div
                          onClick={() => onViewPhoto(item.photoUrl, item.itemName)}
                          className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer relative group/img shrink-0"
                        >
                          <img
                            src={item.photoUrl}
                            alt={item.itemName}
                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-200"
                            loading="lazy"
                          />
                        </div>
                      </td>

                      {/* Item Name */}
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-[220px]">
                        <div className="line-clamp-2">{item.itemName}</div>
                      </td>

                      {/* Status & Quick Toggle */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onToggleStatus(item)}
                          title="Klik untuk mengubah status"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                            isArrived
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-2xs'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300 shadow-2xs'
                          }`}
                        >
                          {isArrived ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          <span>{isArrived ? 'Sudah Datang' : 'Belum Datang'}</span>
                        </button>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4 text-center font-bold text-blue-600">
                        <span className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          {item.quantity || 1}
                        </span>
                      </td>

                      {/* Order Date */}
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {formatDate(item.orderDate)}
                      </td>

                      {/* Arrival Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.arrivalDate ? (
                          <span className="text-emerald-700 font-semibold">
                            {formatDate(item.arrivalDate)}
                          </span>
                        ) : (
                          <span className="text-amber-600 italic">Menunggu</span>
                        )}
                      </td>

                      {/* For Use */}
                      <td className="py-3 px-4 text-slate-600 max-w-[140px] truncate">
                        {item.forUse || '-'}
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-4 text-slate-500 max-w-[160px] truncate">
                        {item.remarks || '-'}
                      </td>

                      {/* Added By */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-medium">
                        {item.createdBy}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewItem(item)}
                            title="Detail"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditItem(item)}
                            title="Edit"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item)}
                            title="Hapus"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="lg:hidden space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
            <Truck className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <p className="mt-2 text-sm font-medium">Tidak ada data orderan.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isArrived = item.status === 'ARRIVED';
            return (
              <div
                key={item.id}
                onClick={() => onViewItem(item)}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 cursor-pointer hover:border-blue-300 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewPhoto(item.photoUrl, item.itemName);
                    }}
                    className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0"
                  >
                    <img
                      src={item.photoUrl}
                      alt={item.itemName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-2">
                        {item.itemName}
                      </h4>
                      <span className="shrink-0 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        {item.quantity || 1} Unit
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStatus(item);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isArrived
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {isArrived ? 'Sudah Datang' : 'Belum Datang'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tgl Pesan:</span>
                    <span className="font-medium text-slate-700">{formatDate(item.orderDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tgl Datang:</span>
                    <span className="font-medium text-slate-700">
                      {item.arrivalDate ? formatDate(item.arrivalDate) : (
                        <span className="text-amber-600">Menunggu Datang</span>
                      )}
                    </span>
                  </div>
                  {item.forUse && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Peruntukan:</span>
                      <span className="font-medium text-slate-800">{item.forUse}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs" onClick={(e) => e.stopPropagation()}>
                  <span className="text-slate-400 text-[11px]">
                    Oleh: <strong className="text-slate-600">{item.createdBy}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditItem(item)}
                      className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item)}
                      className="px-2.5 py-1 rounded-md bg-red-50 text-red-600 font-bold text-xs"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
