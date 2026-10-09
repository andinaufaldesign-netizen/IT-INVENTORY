import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  InventoryItem,
  ActivityLog,
  InventoryCategory,
} from './types';
import {
  getStoredToken,
  getStoredUser,
  clearStoredAuth,
  checkSessionApi,
  fetchInventoryApi,
  fetchActivityApi,
  deleteInventoryApi,
} from './services/api';
import { exportInventoryToExcel } from './services/excelExport';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { SecretCodeModal } from './components/SecretCodeModal';
import { EditUsersView } from './components/EditUsersView';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { MonthlyDataView } from './components/MonthlyDataView';
import { ExportDataView } from './components/ExportDataView';
import { SettingsView } from './components/SettingsView';
import { AddEditInventoryModal } from './components/AddEditInventoryModal';
import { InventoryDetailModal } from './components/InventoryDetailModal';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [defaultCategoryForAdd, setDefaultCategoryForAdd] = useState<InventoryCategory>('PC ITEMS');

  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Fetch inventory & activities when authenticated
  const loadInventoryAndActivities = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingData(true);
    try {
      const [invData, actData] = await Promise.all([
        fetchInventoryApi(),
        fetchActivityApi(),
      ]);
      setInventory(invData);
      setActivities(actData);
    } catch (err: any) {
      console.error('Failed loading data:', err);
      showToast('Could not fetch inventory from server.', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [currentUser, showToast]);

  useEffect(() => {
    if (currentUser) {
      loadInventoryAndActivities();
    }
  }, [currentUser, loadInventoryAndActivities]);

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
    }
  };

  // Category counts
  const categoryCounts = {
    pc: inventory.filter((i) => i.category === 'PC ITEMS').length,
    network: inventory.filter((i) => i.category === 'NETWORK ITEMS').length,
    cctv: inventory.filter((i) => i.category === 'CCTV & TV ITEMS').length,
    total: inventory.length,
  };

  // Add / Edit Modal handlers
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
    loadInventoryAndActivities();
  };

  // Delete modal handlers
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
      loadInventoryAndActivities();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete item.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Photo viewer handler
  const handleViewPhoto = (photoUrl: string, title: string) => {
    setViewPhotoUrl(photoUrl);
    setViewPhotoTitle(title);
  };

  // Excel exports
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
      {/* Sidebar (Desktop Permanent / Mobile Collapsible) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onLogout={handleLogout}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        categoryCounts={categoryCounts}
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
          {currentTab === 'dashboard' && (
            <DashboardView
              inventory={inventory}
              activities={activities}
              onOpenAddModal={handleOpenAddModal}
              onSelectCategory={(cat) => {
                setActiveCategoryFilter(cat);
                setCurrentTab(
                  cat === 'PC ITEMS'
                    ? 'pc-items'
                    : cat === 'NETWORK ITEMS'
                    ? 'network-items'
                    : 'cctv-items'
                );
              }}
              onViewItem={(item) => setDetailItem(item)}
              onViewAllInventory={() => {
                setActiveCategoryFilter('ALL');
                setCurrentTab('inventory');
              }}
            />
          )}

          {(currentTab === 'inventory' ||
            currentTab === 'pc-items' ||
            currentTab === 'network-items' ||
            currentTab === 'cctv-items') && (
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

          {currentTab === 'monthly-data' && (
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

          {currentTab === 'export-data' && (
            <ExportDataView inventory={inventory} onShowToast={showToast} />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              user={currentUser}
              onLogout={handleLogout}
              inventoryCount={inventory.length}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <AddEditInventoryModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        onSuccess={handleSavedInventory}
        itemToEdit={itemToEdit}
        defaultCategory={defaultCategoryForAdd}
      />

      <InventoryDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={handleOpenEditModal}
        onDelete={handleRequestDelete}
        onViewPhoto={handleViewPhoto}
      />

      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        item={itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <ImageViewerModal
        isOpen={!!viewPhotoUrl}
        photoUrl={viewPhotoUrl}
        title={viewPhotoTitle}
        onClose={() => setViewPhotoUrl(null)}
      />

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
