import React, { useState } from 'react';
import { PurchaseOrderItem, PurchaseOrderStatus } from '../types';
import { exportPurchaseOrdersToExcel } from '../services/excelExport';
import {
  FolderDown,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  Loader2,
  Info,
  Clock,
  Boxes,
  Truck,
  Sparkles,
  Search,
} from 'lucide-react';

interface ExportDataPOViewProps {
  purchaseOrders: PurchaseOrderItem[];
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const ExportDataPOView: React.FC<ExportDataPOViewProps> = ({
  purchaseOrders,
  onShowToast,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' or '01'..'12'
  const [selectedStatus, setSelectedStatus] = useState<PurchaseOrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const months = [
    { key: 'ALL', name: 'SEMUA BULAN' },
    { key: '01', name: 'JANUARY' },
    { key: '02', name: 'FEBRUARY' },
    { key: '03', name: 'MARCH' },
    { key: '04', name: 'APRIL' },
    { key: '05', name: 'MAY' },
    { key: '06', name: 'JUNE' },
    { key: '07', name: 'JULY' },
    { key: '08', name: 'AUGUST' },
    { key: '09', name: 'SEPTEMBER' },
    { key: '10', name: 'OCTOBER' },
    { key: '11', name: 'NOVEMBER' },
    { key: '12', name: 'DECEMBER' },
  ];

  // Filter items
  const filteredItems = purchaseOrders.filter((item) => {
    // Year filter (based on orderDate)
    if (item.orderDate && !item.orderDate.startsWith(String(selectedYear))) {
      return false;
    }

    // Month filter
    if (selectedMonth !== 'ALL') {
      const prefix = `${selectedYear}-${selectedMonth}`;
      if (!(item.orderDate || '').startsWith(prefix)) {
        return false;
      }
    }

    // Status filter
    if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.itemName.toLowerCase().includes(q);
      const matchForUse = (item.forUse || '').toLowerCase().includes(q);
      const matchRemarks = (item.remarks || '').toLowerCase().includes(q);
      if (!matchName && !matchForUse && !matchRemarks) return false;
    }

    return true;
  });

  const totalFilteredUnits = filteredItems.reduce((acc, curr) => acc + (curr.quantity || 1), 0);

  const handleExport = async () => {
    if (filteredItems.length === 0) {
      onShowToast('Tidak ada data purchase order yang cocok untuk diekspor.', 'error');
      return;
    }

    setIsExporting(true);
    try {
      const monthLabel = selectedMonth === 'ALL' ? 'ALL_MONTHS' : months.find((m) => m.key === selectedMonth)?.name || selectedMonth;
      const statusLabel = selectedStatus === 'ALL' ? 'ALL' : selectedStatus.replace(/\s+/g, '_');
      const fileName = `HOTEL_IT_PURCHASE_ORDERS_${selectedYear}_${monthLabel}_${statusLabel}.xlsx`;
      const title = `HOTEL IT PURCHASE ORDER REPORT - ${selectedYear} (${selectedMonth === 'ALL' ? 'SEMUA BULAN' : monthLabel})`;
      const sheetName = `PO ${selectedYear} ${selectedMonth}`;

      await exportPurchaseOrdersToExcel(filteredItems, fileName, title, sheetName);
      onShowToast(`File Excel ${fileName} berhasil diekspor!`, 'success');
    } catch (err: any) {
      console.error('Export PO error:', err);
      onShowToast(err?.message || 'Gagal mengekspor data Purchase Order ke Excel.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 sm:p-7 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <FolderDown className="w-3.5 h-3.5" />
            <span>Dedicated Procurement Excel Exporter</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Export Data Purchase Order
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Ekspor data pemesanan barang IT hotel ke file Excel Spreadsheet (.xlsx) berstandar profesional lengkap dengan foto barang embedded, tanggal order & arrival, jumlah unit, peruntukan, dan catatan.
          </p>
        </div>
      </div>

      {/* Configuration Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                PENGATURAN FILTER EKSPOR PO
              </h3>
              <p className="text-xs text-slate-500">
                Tentukan tahun, bulan, dan status pesanan yang ingin dimasukkan ke file Excel
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Year Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tahun Pemesanan
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            {/* Month Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Bulan Pemesanan
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                {months.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Filter Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                <option value="ALL">Semua Status (Sudah Datang & Belum Datang)</option>
                <option value="NOT ARRIVED">Hanya Menunggu Datang (Belum Datang)</option>
                <option value="ARRIVED">Hanya Sudah Datang</option>
              </select>
            </div>

            {/* Keyword Search */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cari Kata Kunci
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nama barang, for use, catatan..."
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Export Action Card */}
          <div className="p-5 rounded-2xl bg-linear-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Ringkasan Data Siap Ekspor
              </div>
              <div className="text-2xl font-black text-emerald-950 mt-0.5">
                {filteredItems.length} <span className="text-sm font-semibold text-emerald-700">Orderan Terpilih</span>
              </div>
              <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                Total {totalFilteredUnits} Unit Fisik
              </div>
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || filteredItems.length === 0}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-extrabold rounded-xl text-sm shadow-lg shadow-emerald-700/30 transition-all cursor-pointer shrink-0"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memproses Excel...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>DOWNLOAD EXCEL (.XLSX)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feature Specs & Preview Column */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h4 className="font-extrabold text-sm uppercase tracking-wider">
                Struktur Kolom Excel
              </h4>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              File Excel yang dihasilkan diformat secara otomatis dengan standar hospitality IT inventory:
            </p>

            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Foto barang disematkan langsung (embedded 50px)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Item Name & Jumlah Unit (Quantity)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tanggal Order & Tanggal Datang</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Peruntukan (For Use) & Catatan (Remarks)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Status dengan styling warna (Hijau/Kuning)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Audit trail (Added by, Last edited by, Timestamps)</span>
              </li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              Format file kompatibel dengan Microsoft Excel, Google Sheets, LibreOffice Calc, dan Apple Numbers.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
