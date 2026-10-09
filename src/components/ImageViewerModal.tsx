import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  photoUrl: string | null;
  title: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  photoUrl,
  title,
  onClose,
}) => {
  if (!isOpen || !photoUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex items-center justify-between pb-3 text-white">
          <div className="flex items-center gap-2">
            <ZoomIn className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold truncate max-w-md">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900 max-h-[80vh] flex items-center justify-center">
          <img
            src={photoUrl}
            alt={title}
            className="max-h-[80vh] max-w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};
