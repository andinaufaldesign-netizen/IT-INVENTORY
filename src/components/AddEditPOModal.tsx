import React, { useState, useEffect, useRef } from 'react';
import { PurchaseOrderItem, PurchaseOrderStatus } from '../types';
import {
  createPurchaseOrderApi,
  updatePurchaseOrderApi,
  uploadPhotoApi,
  compressImage,
} from '../services/api';
import {
  X,
  Upload,
  Camera,
  Image as ImageIcon,
  Calendar,
  Layers,
  FileText,
  Boxes,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building,
} from 'lucide-react';

interface AddEditPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedItem: PurchaseOrderItem, isEdit: boolean) => void;
  itemToEdit?: PurchaseOrderItem | null;
}

export const AddEditPOModal: React.FC<AddEditPOModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  itemToEdit,
}) => {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [orderDate, setOrderDate] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [forUse, setForUse] = useState('');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState<PurchaseOrderStatus>('NOT ARRIVED');

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [newPhotoDataUrl, setNewPhotoDataUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (itemToEdit) {
      setItemName(itemToEdit.itemName);
      setQuantity(itemToEdit.quantity || 1);
      setOrderDate(itemToEdit.orderDate);
      setArrivalDate(itemToEdit.arrivalDate || '');
      setForUse(itemToEdit.forUse || '');
      setRemarks(itemToEdit.remarks || '');
      setStatus(itemToEdit.status || 'NOT ARRIVED');
      setPhotoPreview(itemToEdit.photoUrl);
      setNewPhotoDataUrl(null);
    } else {
      setItemName('');
      setQuantity(1);
      const today = new Date().toISOString().split('T')[0];
      setOrderDate(today);
      setArrivalDate('');
      setForUse('');
      setRemarks('');
      setStatus('NOT ARRIVED');
      setPhotoPreview(null);
      setNewPhotoDataUrl(null);
    }
    setError(null);
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format gambar tidak valid. Format yang didukung: JPG, JPEG, PNG, WEBP');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file, 900, 900, 0.82);
      setNewPhotoDataUrl(compressedDataUrl);
      setPhotoPreview(compressedDataUrl);
      setError(null);
    } catch {
      setError('Gagal memproses gambar. Silakan coba file lain.');
    }
  };

  const handleStatusChange = (newStatus: PurchaseOrderStatus) => {
    setStatus(newStatus);
    // If status changed to ARRIVED and arrivalDate is empty, default to today
    if (newStatus === 'ARRIVED' && !arrivalDate) {
      const today = new Date().toISOString().split('T')[0];
      setArrivalDate(today);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemName.trim()) {
      setError('Nama barang (Item Name) tidak boleh kosong.');
      return;
    }

    if (quantity < 1) {
      setError('Jumlah unit minimal 1.');
      return;
    }

    if (!orderDate) {
      setError('Silakan pilih tanggal order (Date Order).');
      return;
    }

    if (!itemToEdit && !newPhotoDataUrl && !photoPreview) {
      setError('Foto barang wajib diisi untuk order baru.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let finalPhotoUrl = photoPreview || '';

      if (newPhotoDataUrl) {
        finalPhotoUrl = await uploadPhotoApi(
          newPhotoDataUrl,
          `po_${itemName.replace(/\s+/g, '_')}.jpg`
        );
      }

      if (itemToEdit) {
        const updated = await updatePurchaseOrderApi(itemToEdit.id, {
          itemName: itemName.trim(),
          photoUrl: finalPhotoUrl,
          orderDate,
          arrivalDate: arrivalDate.trim() ? arrivalDate.trim() : null,
          quantity: Math.max(1, Number(quantity) || 1),
          forUse: forUse.trim() ? forUse.trim() : null,
          remarks: remarks.trim() ? remarks.trim() : null,
          status,
        });
        onSuccess(updated, true);
      } else {
        const created = await createPurchaseOrderApi({
          itemName: itemName.trim(),
          photoUrl: finalPhotoUrl,
          orderDate,
          arrivalDate: arrivalDate.trim() ? arrivalDate.trim() : null,
          quantity: Math.max(1, Number(quantity) || 1),
          forUse: forUse.trim() ? forUse.trim() : null,
          remarks: remarks.trim() ? remarks.trim() : null,
          status,
        });
        onSuccess(created, false);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan data Purchase Order.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
                {itemToEdit ? 'EDIT PURCHASE ORDER' : 'ADD PURCHASE ORDER'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {itemToEdit ? 'Perbarui data pesanan barang IT' : 'Masukkan data pemesanan barang IT hotel baru'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Contoh: Cisco Catalyst 24-Port PoE Switch"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Photo Upload & Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Foto Barang <span className="text-red-500">*</span>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              {photoPreview ? (
                <div className="relative w-28 h-28 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-slate-200 border border-slate-300 shrink-0 shadow-xs">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setNewPhotoDataUrl(null);
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-28 h-28 sm:w-24 sm:h-24 rounded-lg bg-slate-200/80 border border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                  <ImageIcon className="w-7 h-7" />
                  <span className="text-[10px] mt-1 font-semibold">No Image</span>
                </div>
              )}

              <div className="flex-1 w-full space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.setAttribute('capture', 'environment');
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Kamera</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Format gambar: JPG, PNG, WEBP. Gambar otomatis dikompres agar hemat penyimpanan.
                </p>
              </div>
            </div>
          </div>

          {/* Grid: Jumlah Unit & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Jumlah Unit */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Jumlah Unit <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  required
                  placeholder="1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-bold"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400 pointer-events-none">
                  Unit
                </span>
              </div>
            </div>

            {/* Status (2 opsi: SUDAH DATANG / BELUM DATANG) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Status Order <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange('NOT ARRIVED')}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    status === 'NOT ARRIVED'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                      : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  <span>BELUM DATANG</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('ARRIVED')}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    status === 'ARRIVED'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                      : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>SUDAH DATANG</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid: Date Order & Date Arrival */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Order */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date Order (Tanggal Pesan) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Date Arrival */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date Arrival {status === 'ARRIVED' ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(Opsional)</span>}
              </label>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                placeholder="YYYY-MM-DD"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* For Use */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              For Use (Peruntukan / Bagian)
            </label>
            <div className="relative">
              <input
                type="text"
                value={forUse}
                onChange={(e) => setForUse(e.target.value)}
                placeholder="Contoh: Front Office, Server Room Floor 3, Meeting Room Diamond"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Remarks (Catatan / Keterangan)
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Catatan tambahan seperti nomor SPK, vendor, estimasi garansi, dll."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{itemToEdit ? 'Simpan Perubahan' : 'Tambah Orderan'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
