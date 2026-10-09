import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { InventoryItem } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Delete this inventory item?
            </h3>
            <p className="text-xs text-red-600 font-medium">This action cannot be undone.</p>
          </div>
        </div>

        <div className="my-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="text-xs text-slate-500">Selected Item:</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">{item.itemName}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>{item.category}</span>
            {item.serialNumber && <span>• SN: {item.serialNumber}</span>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-300 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Deleting...' : 'DELETE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
