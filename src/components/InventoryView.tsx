import React, { useState, useMemo } from 'react';
import {
  InventoryItem,
  InventoryCategory,
  FilterOptions,
  SortField,
  SortOrder,
} from '../types';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  Barcode,
  RotateCcw,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
} from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onOpenAddModal: () => void;
  onViewItem: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (item: InventoryItem) => void;
  onViewPhoto: (photoUrl: string, title: string) => void;
  onExportCurrentView: (items: InventoryItem[]) => void;
  initialCategory?: InventoryCategory | 'ALL';
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onOpenAddModal,
  onViewItem,
  onEditItem,
  onDeleteItem,
  onViewPhoto,
  onExportCurrentView,
  initialCategory = 'ALL',
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<InventoryCategory | 'ALL'>(initialCategory);
  const [monthFilter, setMonthFilter] = useState<string>('ALL'); // 'YYYY-MM'
  const [userFilter, setUserFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Distinct users for user filter
  const distinctUsers = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((i) => {
      if (i.createdBy) set.add(i.createdBy);
      if (i.updatedBy) set.add(i.updatedBy);
    });
    return Array.from(set).sort();
  }, [inventory]);

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setMonthFilter('ALL');
    setUserFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'ALL' ||
    monthFilter !== 'ALL' ||
    userFilter !== 'ALL' ||
    dateFrom !== '' ||
    dateTo !== '';

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.itemName.toLowerCase().includes(query);
        const matchSn = item.serialNumber ? item.serialNumber.toLowerCase().includes(query) : false;
        const matchCategory = item.category.toLowerCase().includes(query);
        const matchCreator = item.createdBy.toLowerCase().includes(query);
        const matchEditor = item.updatedBy ? item.updatedBy.toLowerCase().includes(query) : false;

        if (!matchName && !matchSn && !matchCategory && !matchCreator && !matchEditor) {
          return false;
        }
      }

      // 2. Category
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }

      // 3. Month Filter based on dateRepaired
      if (monthFilter !== 'ALL') {
        const itemMonth = (item.dateRepaired || '').substring(0, 7);
        if (itemMonth !== monthFilter) {
          return false;
        }
      }

      // 4. User Filter (added or edited)
      if (userFilter !== 'ALL') {
        if (item.createdBy !== userFilter && item.updatedBy !== userFilter) {
          return false;
        }
      }

      // 5. Date Range based on dateRepaired
      if (dateFrom && item.dateRepaired < dateFrom) {
        return false;
      }
      if (dateTo && item.dateRepaired > dateTo) {
        return false;
      }

      return true;
    });
  }, [inventory, searchQuery, categoryFilter, monthFilter, userFilter, dateFrom, dateTo]);

  // Sorted items
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'itemName':
          comparison = a.itemName.localeCompare(b.itemName);
          break;
        case 'quantity':
          comparison = (a.quantity || 1) - (b.quantity || 1);
          break;
        case 'dateRepaired':
          comparison = a.dateRepaired.localeCompare(b.dateRepaired);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'createdBy':
          comparison = a.createdBy.localeCompare(b.createdBy);
          break;
        case 'updatedAt':
        default:
          comparison =
            new Date(a.updatedAt || a.createdAt).getTime() -
            new Date(b.updatedAt || b.createdAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredItems, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedItems.slice(start, start + itemsPerPage);
  }, [sortedItems, currentPage]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

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
      })}, ${d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })}`;
    } catch {
      return dateStr;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'PC ITEMS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'NETWORK ITEMS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CCTV & TV ITEMS':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header: Title, Total, Export & Add Data */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Inventory Depot
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Showing <span className="font-bold text-slate-900">{filteredItems.length}</span> of{' '}
            <span className="font-bold text-slate-900">{inventory.length}</span> total equipment items
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onExportCurrentView(sortedItems)}
            disabled={sortedItems.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold rounded-xl text-xs sm:text-sm transition-colors disabled:opacity-50 cursor-pointer"
            title="Export filtered records into Excel with photos"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>EXPORT CURRENT VIEW</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ ADD DATA</span>
          </button>
        </div>
      </div>

      {/* Search & Multi-Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Global Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search inventory by name, serial number, category, username..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="PC ITEMS">PC ITEMS</option>
              <option value="NETWORK ITEMS">NETWORK ITEMS</option>
              <option value="CCTV & TV ITEMS">CCTV & TV ITEMS</option>
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Month (Repaired)
            </label>
            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="ALL">All Months</option>
              <option value="2026-01">January 2026</option>
              <option value="2026-02">February 2026</option>
              <option value="2026-03">March 2026</option>
              <option value="2026-04">April 2026</option>
              <option value="2026-05">May 2026</option>
              <option value="2026-06">June 2026</option>
              <option value="2026-07">July 2026</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-10">October 2026</option>
              <option value="2026-11">November 2026</option>
              <option value="2026-12">December 2026</option>
            </select>
          </div>

          {/* User Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Added/Edited By
            </label>
            <select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="ALL">All Users</option>
              {distinctUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range: From */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Repaired From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Date Range: To */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Repaired To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Clear Filter Button if active */}
        {hasActiveFilters && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>CLEAR FILTER</span>
            </button>
          </div>
        )}
      </div>

      {/* Inventory Table / Cards */}
      {sortedItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Layers className="w-8 h-8" />
          </div>

          {inventory.length === 0 ? (
            <div>
              <h3 className="text-base font-bold text-slate-800">No inventory data yet.</h3>
              <p className="text-xs text-slate-500 mt-1">
                Start tracking repaired equipment by adding your first item.
              </p>
              <button
                onClick={onOpenAddModal}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ ADD FIRST DATA</span>
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-bold text-slate-800">No inventory matching your search.</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try clearing active filters or modifying search keywords.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-16">Photo</th>
                    <th className="py-3.5 px-4">
                      <button
                        onClick={() => toggleSort('itemName')}
                        className="inline-flex items-center gap-1 hover:text-blue-600 font-bold cursor-pointer"
                      >
                        <span>Item Name</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </th>
                    <th className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleSort('quantity')}
                        className="inline-flex items-center gap-1 hover:text-blue-600 font-bold cursor-pointer"
                      >
                        <span>Jumlah</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </th>
                    <th className="py-3.5 px-4">
                      <button
                        onClick={() => toggleSort('category')}
                        className="inline-flex items-center gap-1 hover:text-blue-600 font-bold cursor-pointer"
                      >
                        <span>Category</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </th>
                    <th className="py-3.5 px-4">
                      <button
                        onClick={() => toggleSort('dateRepaired')}
                        className="inline-flex items-center gap-1 hover:text-blue-600 font-bold cursor-pointer"
                      >
                        <span>Date Repaired</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </th>
                    <th className="py-3.5 px-4 font-bold">SN</th>
                    <th className="py-3.5 px-4">
                      <button
                        onClick={() => toggleSort('createdBy')}
                        className="inline-flex items-center gap-1 hover:text-blue-600 font-bold cursor-pointer"
                      >
                        <span>Added/Edited By</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </th>
                    <th className="py-3.5 px-4">
                      <button
                        onClick={() => toggleSort('updatedAt')}
                        className="inline-flex items-center gap-1 hover:text-blue-600 font-bold cursor-pointer"
                      >
                        <span>Last Updated</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </th>
                    <th className="py-3.5 px-4 text-center font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Photo Thumbnail */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => onViewPhoto(item.photoUrl, item.itemName)}
                          className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                          title="Click to view large photo"
                        >
                          <img
                            src={item.photoUrl}
                            alt={item.itemName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </td>

                      {/* Item Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="line-clamp-2">{item.itemName}</div>
                      </td>

                      {/* Jumlah Barang */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <span className="font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-xs">
                          {item.quantity || 1} Unit
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getCategoryBadgeClass(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                      </td>

                      {/* Date Repaired */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {formatDate(item.dateRepaired)}
                      </td>

                      {/* SN */}
                      <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                        {item.serialNumber || '-'}
                      </td>

                      {/* Added/Edited By */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 text-xs">
                          {item.updatedBy || item.createdBy}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.updatedBy ? 'Edited' : 'Created'}
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500">
                        {formatDateTime(item.updatedAt || item.createdAt)}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onViewItem(item)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditItem(item)}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit data"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item)}
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete item"
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

          {/* Mobile / Tablet Cards View */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginatedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div
                      onClick={() => onViewPhoto(item.photoUrl, item.itemName)}
                      className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0 cursor-pointer"
                    >
                      <img
                        src={item.photoUrl}
                        alt={item.itemName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mb-1 ${getCategoryBadgeClass(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                        {item.itemName}
                      </h4>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Jumlah Barang:</span>
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {item.quantity || 1} Unit
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date Repaired:</span>
                      <span className="font-semibold text-slate-800">{formatDate(item.dateRepaired)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Serial Number:</span>
                      <span className="font-mono text-slate-800">{item.serialNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">By:</span>
                      <span className="font-semibold text-blue-700">{item.updatedBy || item.createdBy}</span>
                    </div>
                  </div>
                </div>

                {/* Mobile action row */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {formatDate(item.updatedAt || item.createdAt)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewItem(item)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditItem(item)}
                      className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs font-medium text-slate-600">
              <div>
                Showing page <span className="font-bold text-slate-900">{currentPage}</span> of{' '}
                <span className="font-bold text-slate-900">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
