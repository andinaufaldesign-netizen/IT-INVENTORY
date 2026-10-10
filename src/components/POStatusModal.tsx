import React, { useState } from 'react';
import { PurchaseOrderItem, PurchaseOrderStatus } from '../types';
import {
  X,
  Clock,
  CheckCircle2,
  Calendar,
  Building,
  ArrowRight,
  Search,
  ExternalLink,
  Truck,
} from 'lucide-react';

interface POStatusModalProps {
  isOpen: boolean;
  statusType: PurchaseOrderStatus | null;
  items: PurchaseOrderItem[];
  onClose: () => void;
  onSelectItem: (item: PurchaseOrderItem) => void;
  onNavigateToPOsWithStatus: (status: PurchaseOrderStatus) => void;
}

export const POStatusModal: React.FC<POStatusModalProps> = ({
  isOpen,
  statusType,
  items,
  onClose,
  onSelectItem,
  onNavigateToPOsWithStatus,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen || !statusType) return null;

  const isArrived = statusType === 'ARRIVED';
  const filteredItems = items
    .filter((i) => i.status === statusType)
    .filter((i) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        i.itemName.toLowerCase().includes(q) ||
        (i.forUse && i.forUse.toLowerCase().includes(q)) ||
        (i.remarks && i.remarks.toLowerCase().includes(q))
      );
    });

  const totalUnits = filteredItems.reduce((acc, curr) => acc + (curr.quantity || 1), 0);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isArrived
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}
            >
              {isArrived ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isArrived
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isArrived ? 'Sudah Tiba' : 'Menunggu Kedatangan'}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {filteredItems.length} Orderan • {totalUnits} Total Unit
                </span>
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 tracking-tight mt-1">
                {isArrived ? 'ORDERAN SUDAH DATANG' : 'ORDERAN MENUNGGU DATANG'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama barang, peruntukan, atau catatan..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-2.5 pr-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-400">
              <Truck className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
              <p className="mt-2 text-sm font-medium">Tidak ada data orderan untuk status ini.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onClose();
                  onSelectItem(item);
                }}
                className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer bg-slate-50/50 hover:bg-white group"
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                  <img
                    src={item.photoUrl}
                    alt={item.itemName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-blue-600 transition-colors">
                      {item.itemName}
                    </h4>
                    <span className="shrink-0 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      {item.quantity || 1} Unit
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Pesan: {formatDate(item.orderDate)}
                    </span>

                    {item.arrivalDate ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Datang: {formatDate(item.arrivalDate)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <Clock className="w-3 h-3 text-amber-500" />
                        Belum Datang
                      </span>
                    )}

                    {item.forUse && (
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Building className="w-3 h-3 text-slate-400" />
                        {item.forUse}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with view all in PO tab */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-3">
          <span className="text-xs text-slate-500">
            Klik barang untuk melihat detail lengkap & edit
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToPOsWithStatus(statusType);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <span>Buka di Halaman Purchase Order</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
