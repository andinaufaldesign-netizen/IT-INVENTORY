import React, { useState, useMemo } from 'react';
import { PurchaseOrderItem, PurchaseOrderStatus } from '../types';
import {
  CalendarRange,
  Calendar,
  ChevronRight,
  ArrowLeft,
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Boxes,
  Truck,
  Building,
} from 'lucide-react';

interface MonthlyDataPOViewProps {
  purchaseOrders: PurchaseOrderItem[];
  onOpenAddModal: () => void;
  onViewItem: (item: PurchaseOrderItem) => void;
  onEditItem: (item: PurchaseOrderItem) => void;
  onDeleteItem: (item: PurchaseOrderItem) => void;
  onViewPhoto: (photoUrl: string, title: string) => void;
  onExportMonthPO: (monthStr: string, monthLabel: string, items: PurchaseOrderItem[]) => void;
}

interface MonthMeta {
  monthKey: string; // '01' to '12'
  labelId: string; // 'DATA PO BULAN JANUARI 2026'
  name: string; // 'Januari'
  englishName: string; // 'JANUARY'
}

export const MonthlyDataPOView: React.FC<MonthlyDataPOViewProps> = ({
  purchaseOrders,
  onOpenAddModal,
  onViewItem,
  onEditItem,
  onDeleteItem,
  onViewPhoto,
  onExportMonthPO,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [activeMonthKey, setActiveMonthKey] = useState<string | null>(null);

  // Sub-view filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'date' | 'name' | 'qty'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const monthsList: MonthMeta[] = [
    { monthKey: '01', labelId: `DATA PO BULAN JANUARI ${selectedYear}`, name: 'Januari', englishName: 'JANUARY' },
    { monthKey: '02', labelId: `DATA PO BULAN FEBRUARI ${selectedYear}`, name: 'Februari', englishName: 'FEBRUARY' },
    { monthKey: '03', labelId: `DATA PO BULAN MARET ${selectedYear}`, name: 'Maret', englishName: 'MARCH' },
    { monthKey: '04', labelId: `DATA PO BULAN APRIL ${selectedYear}`, name: 'April', englishName: 'APRIL' },
    { monthKey: '05', labelId: `DATA PO BULAN MEI ${selectedYear}`, name: 'Mei', englishName: 'MAY' },
    { monthKey: '06', labelId: `DATA PO BULAN JUNI ${selectedYear}`, name: 'Juni', englishName: 'JUNE' },
    { monthKey: '07', labelId: `DATA PO BULAN JULI ${selectedYear}`, name: 'Juli', englishName: 'JULY' },
    { monthKey: '08', labelId: `DATA PO BULAN AGUSTUS ${selectedYear}`, name: 'Agustus', englishName: 'AUGUST' },
    { monthKey: '09', labelId: `DATA PO BULAN SEPTEMBER ${selectedYear}`, name: 'September', englishName: 'SEPTEMBER' },
    { monthKey: '10', labelId: `DATA PO BULAN OKTOBER ${selectedYear}`, name: 'Oktober', englishName: 'OCTOBER' },
    { monthKey: '11', labelId: `DATA PO BULAN NOVEMBER ${selectedYear}`, name: 'November', englishName: 'NOVEMBER' },
    { monthKey: '12', labelId: `DATA PO BULAN DESEMBER ${selectedYear}`, name: 'Desember', englishName: 'DECEMBER' },
  ];

  // Helper to filter items by year and month based on orderDate
  const getItemsForMonth = (monthKey: string) => {
    const prefix = `${selectedYear}-${monthKey}`;
    return purchaseOrders.filter((item) => (item.orderDate || '').startsWith(prefix));
  };

  const activeMonthMeta = monthsList.find((m) => m.monthKey === activeMonthKey);
  const activeMonthItems = activeMonthKey ? getItemsForMonth(activeMonthKey) : [];

  // Filtered and sorted drill-down items
  const filteredActiveItems = useMemo(() => {
    return activeMonthItems
      .filter((item) => {
        if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.itemName.toLowerCase().includes(q);
          const matchForUse = (item.forUse || '').toLowerCase().includes(q);
          const matchRemarks = (item.remarks || '').toLowerCase().includes(q);
          if (!matchName && !matchForUse && !matchRemarks) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'name') comp = a.itemName.localeCompare(b.itemName);
        else if (sortField === 'qty') comp = (a.quantity || 1) - (b.quantity || 1);
        else comp = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [activeMonthItems, statusFilter, searchQuery, sortField, sortOrder]);

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
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 sm:p-7 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Monthly Procurement & PO Archives</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Monthly Data Purchase Order
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Arsip bulanan pengadaan hardware IT. Pilih bulan pemesanan untuk melihat rincian barang dan mengekspor laporan ke Excel.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Year selector */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-xl p-1 text-xs">
            {[2025, 2026, 2027].map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedYear === yr
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-blue-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ ADD PO</span>
          </button>
        </div>
      </div>

      {/* Main Content: 12-Months Grid OR Month Drill-down View */}
      {!activeMonthKey ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              PILIH BULAN PURCHASE ORDER — TAHUN {selectedYear}
            </h3>
            <span className="text-xs text-slate-500 font-medium">12 Bulan Kalender</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {monthsList.map((m) => {
              const monthItems = getItemsForMonth(m.monthKey);
              const count = monthItems.length;
              const units = monthItems.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
              const arrivedCount = monthItems.filter((i) => i.status === 'ARRIVED').length;
              const pendingCount = monthItems.filter((i) => i.status === 'NOT ARRIVED').length;

              return (
                <div
                  key={m.monthKey}
                  onClick={() => setActiveMonthKey(m.monthKey)}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all cursor-pointer hover:shadow-lg hover:border-blue-400 group relative overflow-hidden flex flex-col justify-between ${
                    count > 0 ? 'border-slate-300' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Bulan {m.monthKey}
                      </span>
                      <h4 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors mt-0.5">
                        {m.name} {selectedYear}
                      </h4>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-2xs">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-black text-slate-900">
                        {count}{' '}
                        <span className="text-xs font-semibold text-slate-500">Order</span>
                      </div>
                      <div className="text-[11px] font-bold text-blue-600 mt-0.5">
                        {units} Unit Fisik
                      </div>
                    </div>

                    <div className="text-right text-[11px] space-y-0.5">
                      <div className="text-emerald-600 font-bold">
                        {arrivedCount} Sudah Tiba
                      </div>
                      <div className="text-amber-600 font-bold">
                        {pendingCount} Menunggu
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Drill-down Sub-view for Selected Month */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveMonthKey(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Kembali ke semua bulan"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Arsip Bulanan PO • {selectedYear}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {activeMonthMeta?.labelId}
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  onExportMonthPO(
                    `${selectedYear}-${activeMonthKey}`,
                    activeMonthMeta?.labelId || '',
                    activeMonthItems
                  )
                }
                disabled={activeMonthItems.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-700/30 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>EXPORT BULAN INI (.XLSX)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMonthKey(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Pilih Bulan Lain
              </button>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari orderan bulan ini..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Status:
              </span>
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({activeMonthItems.length})
              </button>
              <button
                onClick={() => setStatusFilter('NOT ARRIVED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'NOT ARRIVED'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                Belum Datang ({activeMonthItems.filter((i) => i.status === 'NOT ARRIVED').length})
              </button>
              <button
                onClick={() => setStatusFilter('ARRIVED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ARRIVED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                Sudah Datang ({activeMonthItems.filter((i) => i.status === 'ARRIVED').length})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-14">No</th>
                    <th className="py-3.5 px-4 w-16">Foto</th>
                    <th className="py-3.5 px-4">Nama Barang</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Unit</th>
                    <th className="py-3.5 px-4">Tgl Pesan</th>
                    <th className="py-3.5 px-4">Tgl Datang</th>
                    <th className="py-3.5 px-4">For Use</th>
                    <th className="py-3.5 px-4">Remarks</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredActiveItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <Truck className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                        <p className="mt-2 font-medium">
                          Tidak ada data orderan untuk bulan ini.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredActiveItems.map((item, idx) => {
                      const isArrived = item.status === 'ARRIVED';
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => onViewItem(item)}
                        >
                          <td className="py-3 px-4 font-mono text-slate-400 text-center">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <div
                              onClick={() => onViewPhoto(item.photoUrl, item.itemName)}
                              className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer"
                            >
                              <img
                                src={item.photoUrl}
                                alt={item.itemName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {item.itemName}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                isArrived
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-amber-50 text-amber-700 border-amber-300'
                              }`}
                            >
                              {isArrived ? 'Sudah Datang' : 'Belum Datang'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-blue-600">
                            {item.quantity || 1}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {formatDate(item.orderDate)}
                          </td>
                          <td className="py-3 px-4">
                            {item.arrivalDate ? (
                              <span className="text-emerald-700 font-semibold">
                                {formatDate(item.arrivalDate)}
                              </span>
                            ) : (
                              <span className="text-amber-600 italic">Menunggu</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">
                            {item.forUse || '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 truncate max-w-[160px]">
                            {item.remarks || '-'}
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onViewItem(item)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onEditItem(item)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteItem(item)}
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
        </div>
      )}
    </div>
  );
};
