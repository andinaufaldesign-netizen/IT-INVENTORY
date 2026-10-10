import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  InventoryItem,
  ActivityLog,
  InventoryCategory,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  AppSettings,
} from './types';
import {
  getStoredToken,
  getStoredUser,
  clearStoredAuth,
  checkSessionApi,
  fetchInventoryApi,
  fetchActivityApi,
  deleteInventoryApi,
  fetchPurchaseOrdersApi,
  updatePurchaseOrderApi,
  deletePurchaseOrderApi,
  fetchSettingsApi,
  updateSettingsApi,
} from './services/api';
import { getGoogleAccessToken } from './services/googleAuth';
import { syncAllToGoogleSheet } from './services/googleSheets';
import { exportInventoryToExcel, exportPurchaseOrdersToExcel } from './services/excelExport';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { SecretCodeModal } from './components/SecretCodeModal';
import { EditUsersView } from './components/EditUsersView';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { PurchaseOrdersView } from './components/PurchaseOrdersView';
import { MonthlyDataView } from './components/MonthlyDataView';
import { MonthlyDataPOView } from './components/MonthlyDataPOView';
import { ExportDataView } from './components/ExportDataView';
import { ExportDataPOView } from './components/ExportDataPOView';
import { SettingsView } from './components/SettingsView';
import { AddEditInventoryModal } from './components/AddEditInventoryModal';
import { InventoryDetailModal } from './components/InventoryDetailModal';
import { AddEditPOModal } from './components/AddEditPOModal';
import { PODetailModal } from './components/PODetailModal';
import { POStatusModal } from './components/POStatusModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ImageViewerModal } from './components/ImageViewerModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Secret code modal & User Management view state
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [secretToken, setSecretToken] = useState<string | null>(null);
  const [isEditingUsersView, setIsEditingUsersView] = useState(false);

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<InventoryCategory | 'ALL'>('ALL');
  const [activePOStatusFilter, setActivePOStatusFilter] = useState<PurchaseOrderStatus | 'ALL'>('ALL');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderItem[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    googleSheetUrl: '',
    spreadsheetId: '',
    spreadsheetTitle: 'DATABASE APLIKASI IT',
    lastSyncedAt: null,
    autoSyncEnabled: true,
  });
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Inventory Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [defaultCategoryForAdd, setDefaultCategoryForAdd] = useState<InventoryCategory>('PC ITEMS');
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Purchase Order Modals state
  const [isAddEditPOModalOpen, setIsAddEditPOModalOpen] = useState(false);
  const [poItemToEdit, setPoItemToEdit] = useState<PurchaseOrderItem | null>(null);
  const [detailPOItem, setDetailPOItem] = useState<PurchaseOrderItem | null>(null);
  const [poItemToDelete, setPoItemToDelete] = useState<PurchaseOrderItem | null>(null);
  const [isDeletingPO, setIsDeletingPO] = useState(false);
  const [poStatusModalType, setPoStatusModalType] = useState<PurchaseOrderStatus | null>(null);

  // Image viewer lightbox state
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);
  const [viewPhotoTitle, setViewPhotoTitle] = useState('');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial session check
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setIsAuthChecking(false);
        return;
      }

      try {
        const user = await checkSessionApi();
        setCurrentUser(user);
      } catch (err) {
        console.warn('Session check failed:', err);
        clearStoredAuth();
        setCurrentUser(null);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch inventory, POs, settings & activities when authenticated
  const loadAllData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingData(true);
    try {
      const [invData, actData, poData, settingsData] = await Promise.all([
        fetchInventoryApi(),
        fetchActivityApi(),
        fetchPurchaseOrdersApi(),
        fetchSettingsApi().catch(() => null),
      ]);
      setInventory(invData);
      setActivities(actData);
      setPurchaseOrders(poData);
      if (settingsData) {
        setSettings(settingsData);
      }
    } catch (err: any) {
      console.error('Failed loading data:', err);
      showToast('Could not fetch data from server.', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [currentUser, showToast]);

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser, loadAllData]);

  // Auth actions
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsEditingUsersView(false);
    setCurrentTab('dashboard');
    showToast(`Welcome back, ${user.username}!`, 'success');
  };

  const handleLogout = () => {
    clearStoredAuth();
    setCurrentUser(null);
    setSecretToken(null);
    setIsEditingUsersView(false);
    setCurrentTab('dashboard');
    showToast('Logged out successfully.', 'info');
  };

  // Secret code verification flow
  const handleRequestEditCredentials = () => {
    setIsSecretModalOpen(true);
  };

  const handleSecretVerified = (token: string) => {
    setSecretToken(token);
    setIsSecretModalOpen(false);
    setIsEditingUsersView(true);
  };

  const handleBackToLoginFromEditUsers = () => {
    setIsEditingUsersView(false);
    setSecretToken(null);
  };

  // Sidebar navigation handler
  const handleSelectTab = (tab: NavTab, categoryFilter?: InventoryCategory) => {
    if (tab === 'user-management') {
      if (secretToken) {
        setIsEditingUsersView(true);
      } else {
        setIsSecretModalOpen(true);
      }
      return;
    }

    setIsEditingUsersView(false);
    setCurrentTab(tab);

    if (categoryFilter) {
      setActiveCategoryFilter(categoryFilter);
    } else if (tab === 'inventory') {
      setActiveCategoryFilter('ALL');
    } else if (tab === 'purchase-orders') {
      setActivePOStatusFilter('ALL');
    }
  };

  const handleUpdateSettings = async (updates: Partial<AppSettings>) => {
    try {
      const updated = await updateSettingsApi(updates);
      setSettings(updated);
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      showToast(err?.message || 'Gagal memperbarui pengaturan.', 'error');
    }
  };

  const triggerBackgroundSync = async (
    customInv?: InventoryItem[],
    customPOs?: PurchaseOrderItem[]
  ) => {
    if (!settings.autoSyncEnabled || !settings.spreadsheetId) return;
    const token = getGoogleAccessToken();
    if (!token) return;
    try {
      await syncAllToGoogleSheet(
        settings.spreadsheetId,
        token,
        customInv || inventory,
        customPOs || purchaseOrders
      );
      const nowStr = new Date().toISOString();
      await updateSettingsApi({ lastSyncedAt: nowStr });
      setSettings((prev) => ({ ...prev, lastSyncedAt: nowStr }));
    } catch (e) {
      console.warn('Background Google Sheet sync:', e);
    }
  };

  // Category counts
  const categoryCounts = {
    pc: inventory.filter((i) => i.category === 'PC ITEMS').length,
    network: inventory.filter((i) => i.category === 'NETWORK ITEMS').length,
    cctv: inventory.filter((i) => i.category === 'CCTV & TV ITEMS').length,
    room: inventory.filter((i) => i.category === 'ROOM ITEMS').length,
    total: inventory.length,
  };

  const pendingPOCount = purchaseOrders.filter((p) => p.status === 'NOT ARRIVED').length;

  // Inventory Add / Edit Modal handlers
  const handleOpenAddModal = (defaultCategory?: InventoryCategory) => {
    setItemToEdit(null);
    setDefaultCategoryForAdd(defaultCategory || 'PC ITEMS');
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setItemToEdit(item);
    setIsAddEditModalOpen(true);
    setDetailItem(null);
  };

  const handleSavedInventory = (item: InventoryItem, isEdit: boolean) => {
    showToast(isEdit ? 'Inventory updated successfully.' : 'Inventory added successfully.', 'success');
    loadAllData();
    setTimeout(() => triggerBackgroundSync(), 1000);
  };

  // Inventory Delete modal handlers
  const handleRequestDelete = (item: InventoryItem) => {
    setItemToDelete(item);
    setDetailItem(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteInventoryApi(itemToDelete.id);
      showToast('Inventory item deleted successfully.', 'success');
      setItemToDelete(null);
      loadAllData();
      setTimeout(() => triggerBackgroundSync(), 1000);
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete item.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Purchase Order Handlers
  const handleOpenAddPOModal = () => {
    setPoItemToEdit(null);
    setIsAddEditPOModalOpen(true);
  };

  const handleOpenEditPOModal = (item: PurchaseOrderItem) => {
    setPoItemToEdit(item);
    setIsAddEditPOModalOpen(true);
    setDetailPOItem(null);
  };

  const handleSavedPO = (item: PurchaseOrderItem, isEdit: boolean) => {
    showToast(isEdit ? 'Purchase Order berhasil diperbarui.' : 'Purchase Order baru berhasil ditambahkan.', 'success');
    loadAllData();
    setTimeout(() => triggerBackgroundSync(), 1000);
  };

  const handleRequestDeletePO = (item: PurchaseOrderItem) => {
    setPoItemToDelete(item);
    setDetailPOItem(null);
  };

  const handleConfirmDeletePO = async () => {
    if (!poItemToDelete) return;
    setIsDeletingPO(true);
    try {
      await deletePurchaseOrderApi(poItemToDelete.id);
      showToast('Purchase Order berhasil dihapus.', 'success');
      setPoItemToDelete(null);
      loadAllData();
      setTimeout(() => triggerBackgroundSync(), 1000);
    } catch (err: any) {
      showToast(err?.message || 'Gagal menghapus Purchase Order.', 'error');
    } finally {
      setIsDeletingPO(false);
    }
  };

  const handleTogglePOStatus = async (item: PurchaseOrderItem) => {
    const newStatus: PurchaseOrderStatus = item.status === 'ARRIVED' ? 'NOT ARRIVED' : 'ARRIVED';
    const today = new Date().toISOString().split('T')[0];
    const newArrivalDate = newStatus === 'ARRIVED' ? (item.arrivalDate || today) : null;

    try {
      const updated = await updatePurchaseOrderApi(item.id, {
        itemName: item.itemName,
        status: newStatus,
        arrivalDate: newArrivalDate,
      });
      showToast(
        newStatus === 'ARRIVED'
          ? `Status "${item.itemName}" ditandai: SUDAH DATANG.`
          : `Status "${item.itemName}" diubah ke: BELUM DATANG.`,
        'success'
      );
      if (detailPOItem && detailPOItem.id === item.id) {
        setDetailPOItem(updated);
      }
      loadAllData();
      setTimeout(() => triggerBackgroundSync(), 1000);
    } catch (err: any) {
      showToast(err?.message || 'Gagal mengubah status Purchase Order.', 'error');
    }
  };

  // Photo viewer handler
  const handleViewPhoto = (photoUrl: string, title: string) => {
    setViewPhotoUrl(photoUrl);
    setViewPhotoTitle(title);
  };

  // Excel exports - Inventory
  const handleExportMonth = async (monthStr: string, monthLabel: string, items: InventoryItem[]) => {
    try {
      const fileName = `HOTEL_IT_INVENTORY_${monthLabel}_2026.xlsx`;
      const title = `DATA BULAN ${monthLabel} 2026`;
      showToast('Generating Excel with embedded photos...', 'info');
      await exportInventoryToExcel(items, title, fileName, monthLabel);
      showToast(`Exported: ${fileName}`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Export failed.', 'error');
    }
  };

  const handleExportCurrentView = async (items: InventoryItem[]) => {
    try {
      const fileName = `HOTEL_IT_INVENTORY_CURRENT_VIEW.xlsx`;
      const title = `CURRENT INVENTORY VIEW (${items.length} ITEMS)`;
      showToast('Generating Excel with embedded photos...', 'info');
      await exportInventoryToExcel(items, title, fileName, 'FILTERED_VIEW');
      showToast(`Exported: ${fileName}`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Export failed.', 'error');
    }
  };

  // Excel exports - Purchase Orders
  const handleExportPOExcel = async (items: PurchaseOrderItem[]) => {
    try {
      const fileName = `HOTEL_IT_PURCHASE_ORDERS_${new Date().toISOString().split('T')[0]}.xlsx`;
      const title = `HOTEL IT PURCHASE ORDER REPORT (${items.length} ITEMS)`;
      showToast('Menyiapkan file Excel Purchase Order...', 'info');
      await exportPurchaseOrdersToExcel(items, fileName, title, 'PURCHASE_ORDERS');
      showToast(`Berhasil diekspor: ${fileName}`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Gagal mengekspor data Purchase Order.', 'error');
    }
  };

  const handleExportMonthPO = async (monthStr: string, monthLabel: string, items: PurchaseOrderItem[]) => {
    try {
      const fileName = `HOTEL_IT_PO_${monthLabel.replace(/\s+/g, '_')}.xlsx`;
      const title = `HOTEL IT PURCHASE ORDER - ${monthLabel}`;
      showToast('Menyiapkan file Excel bulanan PO...', 'info');
      await exportPurchaseOrdersToExcel(items, fileName, title, 'PO_BULANAN');
      showToast(`Berhasil diekspor: ${fileName}`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Gagal mengekspor data Purchase Order.', 'error');
    }
  };

  // Loading screen during initial token check
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-300">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Loading Hotel IT Inventory...
        </p>
      </div>
    );
  }

  // If not logged in and not editing users -> Show Login Page
  if (!currentUser) {
    if (isEditingUsersView && secretToken) {
      return (
        <>
          <EditUsersView
            secretToken={secretToken}
            onBackToLogin={handleBackToLoginFromEditUsers}
            onShowToast={showToast}
          />
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </>
      );
    }

    return (
      <>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onRequestEditCredentials={handleRequestEditCredentials}
        />
        <SecretCodeModal
          isOpen={isSecretModalOpen}
          onClose={() => setIsSecretModalOpen(false)}
          onSuccess={handleSecretVerified}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // If logged in and requested user management view
  if (isEditingUsersView && secretToken) {
    return (
      <>
        <EditUsersView
          secretToken={secretToken}
          onBackToLogin={() => setIsEditingUsersView(false)}
          onShowToast={showToast}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // MAIN LOGGED-IN APPLICATION LAYOUT
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onLogout={handleLogout}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        categoryCounts={categoryCounts}
        purchaseOrderCount={purchaseOrders.length}
        pendingPOCount={pendingPOCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Real-time Clock and Device Date */}
        <Header
          user={currentUser}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setIsMobileMenuOpen((o) => !o)}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* 1. Dashboard View */}
          {currentTab === 'dashboard' && (
            <DashboardView
              inventory={inventory}
              purchaseOrders={purchaseOrders}
              activities={activities}
              onOpenAddModal={handleOpenAddModal}
              onOpenAddPOModal={handleOpenAddPOModal}
              onOpenPOStatusModal={(status) => setPoStatusModalType(status)}
              onSelectCategory={(cat) => {
                setActiveCategoryFilter(cat);
                setCurrentTab('inventory');
              }}
              onViewItem={(item) => setDetailItem(item)}
              onViewPOItem={(po) => setDetailPOItem(po)}
              onViewAllInventory={() => {
                setActiveCategoryFilter('ALL');
                setCurrentTab('inventory');
              }}
              onNavigateToPOs={() => {
                setActivePOStatusFilter('ALL');
                setCurrentTab('purchase-orders');
              }}
            />
          )}

          {/* 2. Inventory View */}
          {currentTab === 'inventory' && (
            <InventoryView
              inventory={inventory}
              onOpenAddModal={() =>
                handleOpenAddModal(
                  activeCategoryFilter !== 'ALL' ? activeCategoryFilter : undefined
                )
              }
              onViewItem={(item) => setDetailItem(item)}
              onEditItem={handleOpenEditModal}
              onDeleteItem={handleRequestDelete}
              onViewPhoto={handleViewPhoto}
              onExportCurrentView={handleExportCurrentView}
              initialCategory={activeCategoryFilter}
            />
          )}

          {/* 3. Purchase Order Data View */}
          {currentTab === 'purchase-orders' && (
            <PurchaseOrdersView
              purchaseOrders={purchaseOrders}
              onOpenAddModal={handleOpenAddPOModal}
              onViewItem={(po) => setDetailPOItem(po)}
              onEditItem={handleOpenEditPOModal}
              onDeleteItem={handleRequestDeletePO}
              onToggleStatus={handleTogglePOStatus}
              onViewPhoto={handleViewPhoto}
              onExportExcel={handleExportPOExcel}
              initialStatusFilter={activePOStatusFilter}
            />
          )}

          {/* 4. Monthly Data Inventory */}
          {currentTab === 'monthly-data-inventory' && (
            <MonthlyDataView
              inventory={inventory}
              onOpenAddModal={() => handleOpenAddModal()}
              onViewItem={(item) => setDetailItem(item)}
              onEditItem={handleOpenEditModal}
              onDeleteItem={handleRequestDelete}
              onViewPhoto={handleViewPhoto}
              onExportMonth={handleExportMonth}
            />
          )}

          {/* 5. Monthly Data Purchase Order */}
          {currentTab === 'monthly-data-purchase-orders' && (
            <MonthlyDataPOView
              purchaseOrders={purchaseOrders}
              onOpenAddModal={handleOpenAddPOModal}
              onViewItem={(po) => setDetailPOItem(po)}
              onEditItem={handleOpenEditPOModal}
              onDeleteItem={handleRequestDeletePO}
              onViewPhoto={handleViewPhoto}
              onExportMonthPO={handleExportMonthPO}
            />
          )}

          {/* 6. Export Data Inventory */}
          {currentTab === 'export-data-inventory' && (
            <ExportDataView inventory={inventory} onShowToast={showToast} />
          )}

          {/* 7. Export Data Purchase Order */}
          {currentTab === 'export-data-purchase-orders' && (
            <ExportDataPOView purchaseOrders={purchaseOrders} onShowToast={showToast} />
          )}

          {/* 8. Settings View */}
          {currentTab === 'settings' && (
            <SettingsView
              user={currentUser}
              onLogout={handleLogout}
              inventoryCount={inventory.length}
              purchaseOrderCount={purchaseOrders.length}
              inventory={inventory}
              purchaseOrders={purchaseOrders}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onShowToast={showToast}
              onReloadAllData={loadAllData}
            />
          )}
        </main>
      </div>

      {/* --- MODALS --- */}
      {/* Add / Edit Inventory Modal */}
      <AddEditInventoryModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        onSuccess={handleSavedInventory}
        itemToEdit={itemToEdit}
        defaultCategory={defaultCategoryForAdd}
      />

      {/* Inventory Detail Modal */}
      <InventoryDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={handleOpenEditModal}
        onDelete={handleRequestDelete}
        onViewPhoto={handleViewPhoto}
      />

      {/* Delete Inventory Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        item={itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Add / Edit Purchase Order Modal */}
      <AddEditPOModal
        isOpen={isAddEditPOModalOpen}
        onClose={() => setIsAddEditPOModalOpen(false)}
        onSuccess={handleSavedPO}
        itemToEdit={poItemToEdit}
      />

      {/* Purchase Order Detail Modal */}
      <PODetailModal
        item={detailPOItem}
        onClose={() => setDetailPOItem(null)}
        onEdit={handleOpenEditPOModal}
        onDelete={handleRequestDeletePO}
        onToggleStatus={handleTogglePOStatus}
        onViewPhoto={handleViewPhoto}
      />

      {/* Delete Purchase Order Confirm Modal */}
      {poItemToDelete && (
        <DeleteConfirmModal
          isOpen={!!poItemToDelete}
          item={{
            id: poItemToDelete.id,
            itemName: poItemToDelete.itemName,
            quantity: poItemToDelete.quantity,
            category: 'ROOM ITEMS', // placeholder
            dateRepaired: poItemToDelete.orderDate,
            photoUrl: poItemToDelete.photoUrl,
            serialNumber: null,
            createdAt: poItemToDelete.createdAt,
            createdBy: poItemToDelete.createdBy,
            updatedAt: poItemToDelete.updatedAt,
            updatedBy: poItemToDelete.updatedBy,
          }}
          onClose={() => setPoItemToDelete(null)}
          onConfirm={handleConfirmDeletePO}
          isDeleting={isDeletingPO}
        />
      )}

      {/* PO Status List Modal (when clicking Menunggu Datang or Sudah Datang) */}
      <POStatusModal
        isOpen={!!poStatusModalType}
        statusType={poStatusModalType}
        items={purchaseOrders}
        onClose={() => setPoStatusModalType(null)}
        onSelectItem={(po) => setDetailPOItem(po)}
        onNavigateToPOsWithStatus={(status) => {
          setActivePOStatusFilter(status);
          setCurrentTab('purchase-orders');
        }}
      />

      {/* Fullscreen Photo Lightbox Modal */}
      <ImageViewerModal
        isOpen={!!viewPhotoUrl}
        photoUrl={viewPhotoUrl}
        title={viewPhotoTitle}
        onClose={() => setViewPhotoUrl(null)}
      />

      {/* Secret Code Modal */}
      <SecretCodeModal
        isOpen={isSecretModalOpen}
        onClose={() => setIsSecretModalOpen(false)}
        onSuccess={handleSecretVerified}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
