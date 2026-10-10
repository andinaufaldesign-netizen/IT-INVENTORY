import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, InventoryCategory } from '../types';
import { createInventoryApi, updateInventoryApi, uploadPhotoApi, compressImage } from '../services/api';
import {
  X,
  Upload,
  Camera,
  Image as ImageIcon,
  Calendar,
  Layers,
  FileText,
  Binary,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AddEditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedItem: InventoryItem, isEdit: boolean) => void;
  itemToEdit?: InventoryItem | null;
  defaultCategory?: InventoryCategory;
}

export const AddEditInventoryModal: React.FC<AddEditInventoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  itemToEdit,
  defaultCategory = 'PC ITEMS',
}) => {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [category, setCategory] = useState<InventoryCategory>(defaultCategory);
  const [dateRepaired, setDateRepaired] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [newPhotoDataUrl, setNewPhotoDataUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (itemToEdit) {
      setItemName(itemToEdit.itemName);
      setQuantity(itemToEdit.quantity || 1);
      setCategory(itemToEdit.category);
      setDateRepaired(itemToEdit.dateRepaired);
      setSerialNumber(itemToEdit.serialNumber || '');
      setPhotoPreview(itemToEdit.photoUrl);
      setNewPhotoDataUrl(null);
    } else {
      setItemName('');
      setQuantity(1);
      setCategory(defaultCategory);
      // Default to today in YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      setDateRepaired(today);
      setSerialNumber('');
      setPhotoPreview(null);
      setNewPhotoDataUrl(null);
    }
    setError(null);
  }, [itemToEdit, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid format. Accepted formats: JPG, JPEG, PNG, WEBP');
      return;
    }

    try {
      // Compress image client side
      const compressedDataUrl = await compressImage(file, 900, 900, 0.82);
      setNewPhotoDataUrl(compressedDataUrl);
      setPhotoPreview(compressedDataUrl);
      setError(null);
    } catch (err) {
      setError('Failed to process image. Please try another file.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!itemName.trim()) {
      setError('Item name cannot be empty.');
      return;
    }

    if (quantity < 1) {
      setError('Jumlah barang minimal 1.');
      return;
    }

    if (!itemToEdit && !newPhotoDataUrl && !photoPreview) {
      setError('Photo is required when adding new inventory.');
      return;
    }

    if (!dateRepaired) {
      setError('Please select date repaired.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let finalPhotoUrl = photoPreview || '';

      // If user uploaded a new image, save it via upload API
      if (newPhotoDataUrl) {
        finalPhotoUrl = await uploadPhotoApi(newPhotoDataUrl, `${itemName.replace(/\s+/g, '_')}.jpg`);
      }

      if (itemToEdit) {
        // Edit existing item
        const updated = await updateInventoryApi(itemToEdit.id, {
          itemName: itemName.trim(),
          quantity: Math.max(1, Number(quantity) || 1),
          photoUrl: finalPhotoUrl,
          category,
          dateRepaired,
          serialNumber: serialNumber.trim() || null,
        });
        onSuccess(updated, true);
      } else {
        // Create new item
        const created = await createInventoryApi({
          itemName: itemName.trim(),
          quantity: Math.max(1, Number(quantity) || 1),
          photoUrl: finalPhotoUrl,
          category,
          dateRepaired,
          serialNumber: serialNumber.trim() || null,
        });
        onSuccess(created, false);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Unable to save inventory data. Please check connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {itemToEdit ? 'Edit Inventory Item' : 'Add New Inventory'}
            </h2>
            <p className="text-xs text-slate-500">
              {itemToEdit ? 'Modify details of existing equipment' : 'Enter details of repaired or returned IT item'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Nama Barang */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Barang <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Contoh: Dell OptiPlex 7090"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Foto Barang */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Foto Barang <span className="text-red-500">*</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Photo Preview Box */}
              <div className="w-full sm:w-36 h-36 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden flex items-center justify-center shrink-0 relative group">
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-1 bg-white text-slate-800 text-xs font-semibold rounded shadow-sm"
                      >
                        Change
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 stroke-1" />
                    <span className="text-[11px] block">No Photo Selected</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 w-full flex flex-col justify-between h-36">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose / Take Photo</span>
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Supports JPG, JPEG, PNG, WEBP. Images are automatically compressed to ensure fast loading.
                  </p>
                </div>

                {photoPreview && (
                  <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Image ready for upload</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kategori */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InventoryCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-semibold cursor-pointer"
              >
                <option value="PC ITEMS">PC ITEMS</option>
                <option value="NETWORK ITEMS">NETWORK ITEMS</option>
                <option value="CCTV & TV ITEMS">CCTV & TV ITEMS</option>
                <option value="ROOM ITEMS">ROOM ITEMS</option>
              </select>
            </div>

            {/* Jumlah Barang */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Jumlah Barang <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                placeholder="1"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal Dibereskan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tanggal Dibereskan <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dateRepaired}
                onChange={(e) => setDateRepaired(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Serial Number (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Serial Number (Optional)
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SN-88192-A"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>SAVE DATA</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
