import React from 'react';
import { InventoryItem } from '../types';
import {
  X,
  Calendar,
  Layers,
  Barcode,
  User,
  Clock,
  Edit,
  Trash2,
  ShieldCheck,
  Tag,
} from 'lucide-react';

interface InventoryDetailModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onViewPhoto: (photoUrl: string, title: string) => void;
}

export const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({
  item,
  onClose,
  onEdit,
  onDelete,
  onViewPhoto,
}) => {
  if (!item) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
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
        month: 'long',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(
                item.category
              )}`}
            >
              {item.category}
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {item.id}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Top section: Photo and Main Title */}
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Clickable large photo preview */}
            <div
              onClick={() => onViewPhoto(item.photoUrl, item.itemName)}
              className="w-full sm:w-48 h-48 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0 relative group cursor-pointer"
            >
              <img
                src={item.photoUrl}
                alt={item.itemName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                Click to Enlarge
              </div>
            </div>

            {/* Info beside photo */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-snug">
                  {item.itemName}
                </h3>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-700">Tanggal Dibereskan:</span>
                  <span className="font-bold text-slate-900">{formatDate(item.dateRepaired)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-700">Jumlah Barang:</span>
                  <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                    {item.quantity || 1} Unit
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-700">Serial Number:</span>
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                    {item.serialNumber || 'N/A (None)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Trail Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Audit Trail Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Created By</div>
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>{item.createdBy}</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{formatDateTime(item.createdAt)}</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Last Edited By</div>
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{item.updatedBy || item.createdBy}</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{formatDateTime(item.updatedAt || item.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onDelete(item);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Item</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
