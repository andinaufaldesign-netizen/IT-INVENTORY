import React from 'react';
import { PurchaseOrderItem } from '../types';
import {
  X,
  Calendar,
  Layers,
  User,
  Clock,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building,
  FileText,
  Boxes,
  CheckCheck,
} from 'lucide-react';

interface PODetailModalProps {
  item: PurchaseOrderItem | null;
  onClose: () => void;
  onEdit: (item: PurchaseOrderItem) => void;
  onDelete: (item: PurchaseOrderItem) => void;
  onToggleStatus: (item: PurchaseOrderItem) => void;
  onViewPhoto: (photoUrl: string, title: string) => void;
}

export const PODetailModal: React.FC<PODetailModalProps> = ({
  item,
  onClose,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewPhoto,
}) => {
  if (!item) return null;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '-';
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

  const isArrived = item.status === 'ARRIVED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400">
                  {item.id}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isArrived
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {isArrived ? 'SUDAH DATANG' : 'BELUM DATANG'}
                </span>
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 tracking-tight mt-0.5 line-clamp-1">
                {item.itemName}
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

        {/* Content Body */}
        <div className="mt-5 space-y-5">
          {/* Photo preview with zoom option */}
          <div className="relative h-56 sm:h-64 w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200 group">
            <img
              src={item.photoUrl}
              alt={item.itemName}
              className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-105"
              onClick={() => onViewPhoto(item.photoUrl, item.itemName)}
            />
            <button
              type="button"
              onClick={() => onViewPhoto(item.photoUrl, item.itemName)}
              className="absolute bottom-2.5 right-2.5 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 text-white rounded-lg text-xs font-medium backdrop-blur-xs transition-colors cursor-pointer"
            >
              Lihat Foto Penuh
            </button>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Jumlah Unit
              </span>
              <div className="text-xl font-extrabold text-blue-600 mt-0.5">
                {item.quantity || 1} <span className="text-xs font-semibold text-slate-500">Unit</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tanggal Pesan
              </span>
              <div className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                {formatDate(item.orderDate)}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tanggal Datang
              </span>
              <div className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                {item.arrivalDate ? formatDate(item.arrivalDate) : (
                  <span className="text-amber-600 font-semibold text-xs">Menunggu Datang</span>
                )}
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            {/* For Use */}
            <div className="flex items-start gap-2.5">
              <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 font-medium">Peruntukan (For Use): </span>
                <span className="font-bold text-slate-800">
                  {item.forUse || 'Belum ditentukan'}
                </span>
              </div>
            </div>

            {/* Remarks */}
            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 font-medium">Catatan (Remarks): </span>
                <span className="font-medium text-slate-800 whitespace-pre-wrap">
                  {item.remarks || 'Tidak ada catatan khusus'}
                </span>
              </div>
            </div>
          </div>

          {/* Audit trail */}
          <div className="p-3.5 bg-slate-100/70 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1.5">
            <div className="flex items-center justify-between">
              <span>Ditambahkan oleh: <strong className="text-slate-700 font-bold">{item.createdBy}</strong></span>
              <span className="text-slate-400">{formatDateTime(item.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
              <span>Terakhir diedit oleh: <strong className="text-blue-700 font-bold">{item.updatedBy || item.createdBy}</strong></span>
              <span className="text-slate-400">{formatDateTime(item.updatedAt || item.createdAt)}</span>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            {/* Quick Status Toggle Button */}
            <button
              type="button"
              onClick={() => onToggleStatus(item)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isArrived
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{isArrived ? 'Ubah ke Belum Datang' : 'Tandai Sudah Datang'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(item);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
