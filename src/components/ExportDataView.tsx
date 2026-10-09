import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { exportInventoryToExcel } from '../services/excelExport';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  Loader2,
  Info,
  Sparkles,
} from 'lucide-react';

interface ExportDataViewProps {
  inventory: InventoryItem[];
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const ExportDataView: React.FC<ExportDataViewProps> = ({
  inventory,
  onShowToast,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string>('08'); // default August
  const [isExporting, setIsExporting] = useState(false);

  const months = [
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

  const currentMonthMeta = months.find((m) => m.key === selectedMonth) || months[7];
  const targetPrefix = `${selectedYear}-${selectedMonth}`;

  // Filter items matching dateRepaired
  const monthItems = inventory.filter((item) => (item.dateRepaired || '').startsWith(targetPrefix));

  const handleExportMonthly = async () => {
    if (monthItems.length === 0) {
      onShowToast(`No inventory items found for ${currentMonthMeta.name} ${selectedYear}.`, 'error');
      return;
    }

    setIsExporting(true);
    try {
      const fileName = `HOTEL_IT_INVENTORY_${currentMonthMeta.name}_${selectedYear}.xlsx`;
      const title = `DATA BULAN ${currentMonthMeta.name} ${selectedYear}`;
      const sheetName = `${currentMonthMeta.name} ${selectedYear}`;

      await exportInventoryToExcel(monthItems, title, fileName, sheetName);
      onShowToast(`Export completed: ${fileName}`, 'success');
    } catch (err: any) {
      console.error(err);
      onShowToast(err?.message || 'Failed generating Excel file. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    if (inventory.length === 0) {
      onShowToast('No inventory records available to export.', 'error');
      return;
    }

    setIsExporting(true);
    try {
      const fileName = `HOTEL_IT_INVENTORY_ALL_${selectedYear}.xlsx`;
      const title = `ALL HOTEL IT INVENTORY RECORDS - ${selectedYear}`;
      const sheetName = `ALL INVENTORY ${selectedYear}`;

      await exportInventoryToExcel(inventory, title, fileName, sheetName);
      onShowToast(`Full inventory exported: ${fileName}`, 'success');
    } catch (err: any) {
      console.error(err);
      onShowToast(err?.message || 'Failed generating Excel file.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          EXPORT DATA CENTER
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Generate structured Microsoft Excel (.xlsx) spreadsheets with embedded equipment photos
        </p>
      </div>

      {/* Main Export Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Monthly Inventory Export
            </h3>
            <p className="text-xs text-slate-500">
              Select desired month and target year to generate the official departmental report
            </p>
          </div>
        </div>

        {/* Form controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Year selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
              <option value={2028}>2028</option>
            </select>
          </div>

          {/* Month selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Export Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.name} {selectedYear}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Target summary pill */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="text-slate-500 font-medium">Selected Export Target:</div>
            <div className="text-slate-900 font-bold text-sm mt-0.5">
              DATA BULAN {currentMonthMeta.name} {selectedYear}
            </div>
            <div className="text-blue-700 font-mono mt-0.5">
              File name: HOTEL_IT_INVENTORY_{currentMonthMeta.name}_{selectedYear}.xlsx
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                monthItems.length > 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {monthItems.length} Records Found
            </span>
          </div>
        </div>

        {/* Feature highlight bullet points */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs text-blue-900 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Excel Export Specifications Enforced:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Embedded thumbnail photos in cell column B with proportional row sizing</li>
            <li>Formal department header title and timestamp audit trail</li>
            <li>Styled dark navy header with bold typography & auto column widths</li>
            <li>Table borders, cell alignments, freeze header pane, and Excel auto-filter enabled</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3">
          <button
            onClick={handleExportAll}
            disabled={isExporting || inventory.length === 0}
            className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Export All Records ({inventory.length} items)
          </button>

          <button
            onClick={handleExportMonthly}
            disabled={isExporting || monthItems.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Excel with Photos...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>EXPORT TO EXCEL</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
