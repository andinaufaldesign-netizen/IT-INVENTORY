import React, { useState, useMemo } from 'react';
import { InventoryItem, InventoryCategory } from '../types';
import {
  CalendarDays,
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
  Barcode,
} from 'lucide-react';

interface MonthlyDataViewProps {
  inventory: InventoryItem[];
  onOpenAddModal: () => void;
  onViewItem: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (item: InventoryItem) => void;
  onViewPhoto: (photoUrl: string, title: string) => void;
  onExportMonth: (monthStr: string, monthLabel: string, items: InventoryItem[]) => void;
}

interface MonthMeta {
  monthKey: string; // '01' to '12'
  labelId: string; // 'DATA BULAN JANUARI 2026'
  name: string; // 'Januari'
  englishName: string; // 'January'
}

export const MonthlyDataView: React.FC<MonthlyDataViewProps> = ({
  inventory,
  onOpenAddModal,
  onViewItem,
  onEditItem,
  onDeleteItem,
  onViewPhoto,
  onExportMonth,
}) => {
  // Year selector to support 2025, 2026, 2027, 2028+
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  // Selected month in drill-down (null means month selector grid)
  const [activeMonthKey, setActiveMonthKey] = useState<string | null>(null);

  // Month sub-view filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<InventoryCategory | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const monthsList: MonthMeta[] = [
    { monthKey: '01', labelId: `DATA BULAN JANUARI ${selectedYear}`, name: 'Januari', englishName: 'JANUARY' },
    { monthKey: '02', labelId: `DATA BULAN FEBRUARI ${selectedYear}`, name: 'Februari', englishName: 'FEBRUARY' },
    { monthKey: '03', labelId: `DATA BULAN MARET ${selectedYear}`, name: 'Maret', englishName: 'MARCH' },
    { monthKey: '04', labelId: `DATA BULAN APRIL ${selectedYear}`, name: 'April', englishName: 'APRIL' },
    { monthKey: '05', labelId: `DATA BULAN MEI ${selectedYear}`, name: 'Mei', englishName: 'MAY' },
    { monthKey: '06', labelId: `DATA BULAN JUNI ${selectedYear}`, name: 'Juni', englishName: 'JUNE' },
    { monthKey: '07', labelId: `DATA BULAN JULI ${selectedYear}`, name: 'Juli', englishName: 'JULY' },
    { monthKey: '08', labelId: `DATA BULAN AGUSTUS ${selectedYear}`, name: 'Agustus', englishName: 'AUGUST' },
    { monthKey: '09', labelId: `DATA BULAN SEPTEMBER ${selectedYear}`, name: 'September', englishName: 'SEPTEMBER' },
    { monthKey: '10', labelId: `DATA BULAN OKTOBER ${selectedYear}`, name: 'Oktober', englishName: 'OCTOBER' },
    { monthKey: '11', labelId: `DATA BULAN NOVEMBER ${selectedYear}`, name: 'November', englishName: 'NOVEMBER' },
    { monthKey: '12', labelId: `DATA BULAN DESEMBER ${selectedYear}`, name: 'Desember', englishName: 'DECEMBER' },
  ];

  // Calculate items count per month strictly based on dateRepaired
  const monthCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    monthsList.forEach((m) => {
      const prefix = `${selectedYear}-${m.monthKey}`;
      counts[m.monthKey] = inventory.filter((item) => (item.dateRepaired || '').startsWith(prefix)).length;
    });
    return counts;
  }, [inventory, selectedYear]);

  // When a specific month is active, filter its items
  const activeMonthMeta = monthsList.find((m) => m.monthKey === activeMonthKey);
  const activeMonthPrefix = activeMonthKey ? `${selectedYear}-${activeMonthKey}` : '';

  const activeMonthItems = useMemo(() => {
    if (!activeMonthPrefix) return [];
    return inventory.filter((item) => (item.dateRepaired || '').startsWith(activeMonthPrefix));
  }, [inventory, activeMonthPrefix]);

  // Sub-filtering & sorting
  const filteredMonthItems = useMemo(() => {
    return activeMonthItems
      .filter((item) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.itemName.toLowerCase().includes(q);
          const matchSn = item.serialNumber?.toLowerCase().includes(q) || false;
          const matchCat = item.category.toLowerCase().includes(q);
          const matchUser = item.createdBy.toLowerCase().includes(q);
          if (!matchName && !matchSn && !matchCat && !matchUser) return false;
        }
        if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === 'name') {
          return sortOrder === 'asc'
            ? a.itemName.localeCompare(b.itemName)
            : b.itemName.localeCompare(a.itemName);
        }
        return sortOrder === 'asc'
          ? a.dateRepaired.localeCompare(b.dateRepaired)
          : b.dateRepaired.localeCompare(a.dateRepaired);
      });
  }, [activeMonthItems, searchQuery, categoryFilter, sortField, sortOrder]);

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

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'PC ITEMS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'NETWORK ITEMS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CCTV & TV ITEMS':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ROOM ITEMS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // If no month selected, render 12 month cards
  if (!activeMonthKey || !activeMonthMeta) {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        {/* Title & Year Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              MONTHLY DATA INVENTORY
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Pengelompokan barang inventaris IT berdasarkan tanggal dibereskan (dateRepaired)
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="font-bold text-sm text-blue-600 bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
              <option value={2028}>2028</option>
            </select>
          </div>
        </div>

        {/* 12 Months Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthsList.map((m) => {
            const count = monthCounts[m.monthKey] || 0;
            return (
              <div
                key={m.monthKey}
                onClick={() => {
                  setActiveMonthKey(m.monthKey);
                  setSearchQuery('');
                  setCategoryFilter('ALL');
                }}
                className="bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      BULAN {m.monthKey}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        count > 0
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {count} ITEMS
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                    {m.labelId}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Periode {m.name} {selectedYear}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Buka Data Bulan</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Month Detail Sub-view
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Back button & Month Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setActiveMonthKey(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>KEMBALI KE DAFTAR BULAN</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {activeMonthMeta.labelId}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Daftar barang IT dibereskan pada bulan {activeMonthMeta.name} {selectedYear} (Total:{' '}
            <span className="font-bold text-slate-900">{filteredMonthItems.length}</span> barang)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() =>
              onExportMonth(
                `${selectedYear}-${activeMonthKey}`,
                activeMonthMeta.englishName,
                activeMonthItems
              )
            }
            disabled={activeMonthItems.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold rounded-xl text-xs sm:text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>EXPORT {activeMonthMeta.englishName}</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ ADD DATA</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${activeMonthMeta.name} ${selectedYear}...`}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-blue-600 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="PC ITEMS">PC ITEMS</option>
            <option value="NETWORK ITEMS">NETWORK ITEMS</option>
            <option value="CCTV & TV ITEMS">CCTV & TV ITEMS</option>
            <option value="ROOM ITEMS">ROOM ITEMS</option>
          </select>

          <button
            onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap"
          >
            {sortOrder === 'asc' ? 'Oldest Date' : 'Newest Date'}
          </button>
        </div>
      </div>

      {/* Items List */}
      {filteredMonthItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="font-bold text-slate-700 text-base">
            Tidak ada data inventory pada {activeMonthMeta.name} {selectedYear}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Belum ada barang yang didata dengan tanggal dibereskan pada bulan ini.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-16">Photo</th>
                  <th className="py-3.5 px-4">Nama Barang</th>
                  <th className="py-3.5 px-4 text-center">Jumlah</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Tanggal Dibereskan</th>
                  <th className="py-3.5 px-4">SN</th>
                  <th className="py-3.5 px-4">Added / Edited By</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMonthItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div
                        onClick={() => onViewPhoto(item.photoUrl, item.itemName)}
                        className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 cursor-pointer"
                      >
                        <img
                          src={item.photoUrl}
                          alt={item.itemName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.itemName}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <span className="font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-xs">
                        {item.quantity || 1} Unit
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getCategoryColor(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                      {formatDate(item.dateRepaired)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                      {item.serialNumber || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs">
                      <div className="font-semibold text-slate-900">{item.updatedBy || item.createdBy}</div>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onViewItem(item)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
