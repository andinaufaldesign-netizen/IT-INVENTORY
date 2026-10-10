import React, { useState, useEffect } from 'react';
import { User, InventoryItem, PurchaseOrderItem, AppSettings } from '../types';
import {
  Settings,
  Hotel,
  Shield,
  User as UserIcon,
  LogOut,
  HardDrive,
  CheckCircle,
  FileSpreadsheet,
  Link as LinkIcon,
  ExternalLink,
  RefreshCw,
  Download,
  Upload,
  AlertCircle,
  Info,
  Sparkles,
  Loader2,
  CheckCircle2,
  Database as DatabaseIcon,
  Copy,
} from 'lucide-react';
import {
  initGoogleAuth,
  googleSignIn,
  googleSignOut,
  getGoogleAccessToken,
  getGoogleUser,
} from '../services/googleAuth';
import {
  extractSpreadsheetId,
  getSpreadsheetDetails,
  syncAllToGoogleSheet,
  pullDataFromGoogleSheet,
} from '../services/googleSheets';
import { User as FirebaseUser } from 'firebase/auth';
import { createInventoryApi, createPurchaseOrderApi } from '../services/api';

interface SettingsViewProps {
  user: User | null;
  onLogout: () => void;
  inventoryCount: number;
  purchaseOrderCount: number;
  inventory: InventoryItem[];
  purchaseOrders: PurchaseOrderItem[];
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onReloadAllData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onLogout,
  inventoryCount,
  purchaseOrderCount,
  inventory,
  purchaseOrders,
  settings,
  onUpdateSettings,
  onShowToast,
  onReloadAllData,
}) => {
  const [sheetUrl, setSheetUrl] = useState(settings.googleSheetUrl || '');
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(getGoogleUser());
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [detectedTitle, setDetectedTitle] = useState(settings.spreadsheetTitle || 'DATABASE APLIKASI IT');
  const [autoSync, setAutoSync] = useState(settings.autoSyncEnabled !== false);

  useEffect(() => {
    setSheetUrl(settings.googleSheetUrl || '');
    setDetectedTitle(settings.spreadsheetTitle || 'DATABASE APLIKASI IT');
    setAutoSync(settings.autoSyncEnabled !== false);
  }, [settings]);

  // Listen to Google OAuth state
  useEffect(() => {
    const unsubscribe = initGoogleAuth((fbUser) => {
      setGoogleUser(fbUser);
    });
    return () => unsubscribe();
  }, []);

  const spreadsheetId = extractSpreadsheetId(sheetUrl);

  const handleSignInGoogle = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      setGoogleUser(res.user);
      onShowToast(`Akun Google terhubung: ${res.user.email}`, 'success');

      // If URL is configured, auto-detect spreadsheet details
      if (spreadsheetId && res.accessToken) {
        try {
          const meta = await getSpreadsheetDetails(spreadsheetId, res.accessToken);
          setDetectedTitle(meta.title);
          onUpdateSettings({ spreadsheetTitle: meta.title });
        } catch (e) {
          console.warn('Could not read title:', e);
        }
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(err?.message || 'Gagal login ke Google.', 'error');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOutGoogle = async () => {
    try {
      await googleSignOut();
      setGoogleUser(null);
      onShowToast('Akun Google telah diputus.', 'info');
    } catch (err: any) {
      onShowToast(err?.message || 'Gagal memutus akun Google.', 'error');
    }
  };

  const handleSaveSheetUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = extractSpreadsheetId(sheetUrl);

    if (!sheetUrl.trim()) {
      onUpdateSettings({
        googleSheetUrl: '',
        spreadsheetId: '',
        spreadsheetTitle: 'DATABASE APLIKASI IT',
      });
      onShowToast('Pengaturan Google Sheet telah dikosongkan.', 'info');
      return;
    }

    if (!cleanId) {
      onShowToast('Format Link Google Sheet tidak valid. Salin link lengkap dari browser.', 'error');
      return;
    }

    setIsSavingUrl(true);
    try {
      let title = 'DATABASE APLIKASI IT';
      const token = getGoogleAccessToken();
      if (token) {
        try {
          const meta = await getSpreadsheetDetails(cleanId, token);
          title = meta.title;
          setDetectedTitle(title);
        } catch {
          // If token not yet granted, fallback to default title
        }
      }

      onUpdateSettings({
        googleSheetUrl: sheetUrl.trim(),
        spreadsheetId: cleanId,
        spreadsheetTitle: title,
      });

      onShowToast(`Link Google Sheet berhasil disimpan! ID: ${cleanId.substring(0, 10)}...`, 'success');
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleSyncToGoogleSheet = async () => {
    const id = spreadsheetId || settings.spreadsheetId;
    if (!id) {
      onShowToast('Silakan tempel dan simpan Link Google Spreadsheet terlebih dahulu.', 'error');
      return;
    }

    const token = getGoogleAccessToken();
    if (!token) {
      onShowToast('Silakan klik "Sign in with Google" untuk mengizinkan sinkronisasi spreadsheet.', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await syncAllToGoogleSheet(id, token, inventory, purchaseOrders);
      const nowStr = new Date().toISOString();
      onUpdateSettings({ lastSyncedAt: nowStr });
      onShowToast(
        `Sukses sinkronisasi! ${res.inventoryRows} barang Inventaris & ${res.poRows} Purchase Orders telah terhubung ke spreadsheet.`,
        'success'
      );
    } catch (err: any) {
      console.error(err);
      onShowToast(err?.message || 'Gagal melakukan sinkronisasi ke Google Sheet.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromGoogleSheet = async () => {
    const id = spreadsheetId || settings.spreadsheetId;
    if (!id) {
      onShowToast('Link Google Spreadsheet belum diatur.', 'error');
      return;
    }

    const token = getGoogleAccessToken();
    if (!token) {
      onShowToast('Silakan login dengan Google untuk membaca data dari spreadsheet.', 'error');
      return;
    }

    const confirmed = window.confirm(
      'Apakah Anda yakin ingin menarik data dari Google Spreadsheet? Data yang ada di spreadsheet akan ditambahkan ke sistem ini.'
    );
    if (!confirmed) return;

    setIsPulling(true);
    try {
      const data = await pullDataFromGoogleSheet(id, token);
      let invCount = 0;
      let poCount = 0;

      // Import inventory items that don't already exist
      for (const item of data.inventory) {
        if (!inventory.some((i) => i.itemName.toLowerCase() === item.itemName.toLowerCase())) {
          await createInventoryApi({
            itemName: item.itemName,
            quantity: item.quantity,
            category: item.category,
            dateRepaired: item.dateRepaired,
            serialNumber: item.serialNumber,
            photoUrl: item.photoUrl || 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=600&q=80',
          });
          invCount++;
        }
      }

      // Import PO items that don't already exist
      for (const po of data.purchaseOrders) {
        if (!purchaseOrders.some((p) => p.itemName.toLowerCase() === po.itemName.toLowerCase())) {
          await createPurchaseOrderApi({
            itemName: po.itemName,
            quantity: po.quantity,
            orderDate: po.orderDate,
            arrivalDate: po.arrivalDate,
            status: po.status,
            forUse: po.forUse,
            remarks: po.remarks,
            photoUrl: po.photoUrl || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
          });
          poCount++;
        }
      }

      if (onReloadAllData) onReloadAllData();
      onShowToast(`Berhasil mengimpor ${invCount} Inventaris & ${poCount} Purchase Orders dari Spreadsheet!`, 'success');
    } catch (err: any) {
      console.error(err);
      onShowToast(err?.message || 'Gagal menarik data dari Google Spreadsheet.', 'error');
    } finally {
      setIsPulling(false);
    }
  };

  const handleToggleAutoSync = () => {
    const nextVal = !autoSync;
    setAutoSync(nextVal);
    onUpdateSettings({ autoSyncEnabled: nextVal });
    onShowToast(`Auto-sync otomatis ke Google Sheet ${nextVal ? 'diaktifkan' : 'dinonaktifkan'}.`, 'info');
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return 'Belum pernah disinkronkan';
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-150">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          System Settings & Database Integration
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Konfigurasi basis data Google Spreadsheet, sesi pengguna, dan preferensi aplikasi
        </p>
      </div>

      {/* ============================================================== */}
      {/* PRIMARY FEATURE: GOOGLE SPREADSHEET DATABASE INTEGRATION */}
      {/* ============================================================== */}
      <section className="bg-white border-2 border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-[100px] pointer-events-none rounded-full" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-xs shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  DATABASE APLIKASI IT
                </span>
                <span className="text-xs text-slate-400 font-medium">Google Sheets Live Sync</span>
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 tracking-tight mt-0.5">
                Google Spreadsheet Database Integration
              </h3>
            </div>
          </div>

          {/* Quick status pill */}
          <div className="flex items-center gap-2">
            {spreadsheetId ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Spreadsheet Terhubung</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Belum Dikonfigurasi</span>
              </span>
            )}
          </div>
        </div>

        {/* 1. Google OAuth Authorization Card */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Otorisasi Akun Google (Google Sheets API)
              </span>
              {googleUser && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Aktif
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
              {googleUser
                ? `Terhubung sebagai ${googleUser.email}. Aplikasi diizinkan membaca dan menulis ke spreadsheet Anda.`
                : 'Hubungkan akun Google Anda agar aplikasi dapat otomatis menyinkronkan data inventaris dan purchase order ke Google Spreadsheet.'}
            </p>
          </div>

          <div className="shrink-0">
            {googleUser ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                    {googleUser.displayName || googleUser.email}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                    {googleUser.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOutGoogle}
                  className="px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
                >
                  Putus Akun
                </button>
              </div>
            ) : (
              /* Official Google Sign-In Button */
              <button
                type="button"
                onClick={handleSignInGoogle}
                disabled={isSigningIn}
                className="inline-flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Menghubungkan...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 2. Insert Google Sheet Link Input */}
        <form onSubmit={handleSaveSheetUrl} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Insert Google Sheet Link for Database <span className="text-red-500">*</span>
              </label>
              {spreadsheetId && (
                <span className="text-[11px] font-mono text-emerald-600 font-bold">
                  ID: {spreadsheetId}
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
                className="w-full pl-10 pr-28 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={isSavingUrl}
                className="absolute right-2 top-2 bottom-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSavingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>Simpan Link</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              Buat spreadsheet di Google Sheets Anda dengan judul <strong>"DATABASE APLIKASI IT"</strong>, lalu pastikan link akses diatur ke{' '}
              <strong className="text-slate-700">"Siapa saja yang memiliki link dapat mengedit" (Anyone with the link can edit)</strong>, kemudian salin linknya ke kolom di atas.
            </p>
          </div>
        </form>

        {/* 3. Synchronization & Actions Controls */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Status Database Spreadsheet
              </span>
              <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
                <DatabaseIcon className="w-4 h-4 text-emerald-600" />
                <span>{detectedTitle}</span>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500">
              <span>Terakhir disinkronkan: </span>
              <strong className="text-slate-700 block sm:inline font-bold">
                {formatDateTime(settings.lastSyncedAt)}
              </strong>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Push / Sync to Google Sheet */}
            <button
              type="button"
              onClick={handleSyncToGoogleSheet}
              disabled={isSyncing || !spreadsheetId}
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyinkronkan ke Spreadsheet...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>SINKRONKAN SEKARANG KE GOOGLE SHEET</span>
                </>
              )}
            </button>

            {/* Pull / Import from Google Sheet */}
            <button
              type="button"
              onClick={handlePullFromGoogleSheet}
              disabled={isPulling || !spreadsheetId}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white hover:bg-slate-100 disabled:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
            >
              {isPulling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Mengimpor dari Spreadsheet...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Tarik Data dari Spreadsheet</span>
                </>
              )}
            </button>

            {/* Open Google Sheet link in new tab */}
            {spreadsheetId && (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-xl text-xs sm:text-sm transition-all ml-auto"
              >
                <span>Buka Spreadsheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Auto-sync Toggle */}
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoSyncToggle"
                checked={autoSync}
                onChange={handleToggleAutoSync}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="autoSyncToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Auto-Sync otomatis saat ada penambahan atau pengeditan data
              </label>
            </div>
            <span className="text-[11px] text-slate-400">
              {autoSync ? 'Otomatis diperbarui' : 'Hanya manual'}
            </span>
          </div>
        </div>

        {/* 4. Automated Sheet Tabs Structure Guide */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 text-xs text-slate-600 space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Otomatisasi Struktur Sheet oleh Sistem</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Saat sinkronisasi pertama kali dijalankan, sistem akan <strong>otomatis membuat 2 tab sheet</strong> di Google Spreadsheet Anda tanpa perlu dibuat manual:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="font-bold text-blue-700 flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Tab: INVENTORY</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Menyimpan data: ID, No, Nama Barang, Jumlah Barang, Kategori, Tanggal Dibereskan, Serial Number, Foto URL, Added By, Last Edited By, Waktu Dibuat & Diperbarui.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="font-bold text-emerald-700 flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Tab: PURCHASE_ORDERS</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Menyimpan data: ID, No, Nama Barang, Jumlah Unit, Tanggal Pesan, Tanggal Datang, Status Order, Peruntukan (For Use), Catatan (Remarks), Foto URL, Added By, Last Edited By.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* APP PROFILE & SESSION INFO */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* App Profile */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Hotel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Application Information</h3>
              <p className="text-xs text-slate-500">System deployment info</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">App Name</span>
              <span className="font-bold text-slate-900">HOTEL IT INVENTORY MANAGEMENT</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Department</span>
              <span className="font-semibold text-slate-800">Information Technology</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Version</span>
              <span className="font-mono text-slate-700">v2.5.0 (Google Sheets Sync Active)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Database Persistence</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Active Disk Storage & Cloud Sheets
              </span>
            </div>
          </div>
        </div>

        {/* Current User Session */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Current Logged-in User</h3>
              <p className="text-xs text-slate-500">Active session credentials</p>
            </div>
          </div>

          {user ? (
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Username</span>
                <span className="font-mono font-bold text-blue-700">{user.username}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Department Role</span>
                <span className="font-semibold text-slate-900">{user.role}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Session Status</span>
                <span className="font-semibold text-emerald-600">Authenticated (Secure)</span>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Current Session</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400">Not logged in.</div>
          )}
        </div>
      </div>
    </div>
  );
};
