export type InventoryCategory = 'PC ITEMS' | 'NETWORK ITEMS' | 'CCTV & TV ITEMS' | 'ROOM ITEMS';

export interface User {
  id: string;
  username: string;
  role: 'IT MANAGER' | 'IT ASSIST' | 'IT TRAINEE';
  displayName: string;
}

export interface UserManagementItem {
  id: string;
  label: string;
  username: string;
  role: string;
  displayName: string;
  maskedPassword: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  quantity: number;
  photoUrl: string;
  category: InventoryCategory;
  dateRepaired: string; // YYYY-MM-DD
  serialNumber: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ActivityLog {
  id: string;
  action: 'ADD' | 'EDIT' | 'DELETE';
  itemId?: string;
  itemName: string;
  category?: InventoryCategory;
  performedBy: string;
  timestamp: string;
  details?: string;
}

export type SortField = 'itemName' | 'quantity' | 'dateRepaired' | 'updatedAt' | 'category' | 'createdBy';
export type SortOrder = 'asc' | 'desc';

export interface FilterOptions {
  searchQuery: string;
  category: InventoryCategory | 'ALL';
  month: string; // 'ALL' or 'YYYY-MM' (e.g. '2026-08')
  user: string; // 'ALL' or username
  dateFrom: string;
  dateTo: string;
}

// Purchase Order System Types
export type PurchaseOrderStatus = 'NOT ARRIVED' | 'ARRIVED';

export interface PurchaseOrderItem {
  id: string;
  itemName: string;
  photoUrl: string;
  orderDate: string; // YYYY-MM-DD
  arrivalDate: string | null; // YYYY-MM-DD or null
  quantity: number;
  forUse: string | null;
  remarks: string | null;
  status: PurchaseOrderStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type POSortField =
  | 'itemName'
  | 'orderDate'
  | 'arrivalDate'
  | 'quantity'
  | 'status'
  | 'updatedAt'
  | 'createdBy';

export interface POFilterOptions {
  searchQuery: string;
  status: PurchaseOrderStatus | 'ALL';
  month: string; // 'ALL' or 'YYYY-MM'
  year: string; // 'ALL' or 'YYYY'
  forUse: string; // 'ALL' or specific
  user: string; // 'ALL' or username
  dateFrom: string;
  dateTo: string;
}

// Dashboard Recently Edited Unified Feed Item
export type RecentFeedItem =
  | { type: 'INVENTORY'; data: InventoryItem; timestamp: string }
  | { type: 'PURCHASE_ORDER'; data: PurchaseOrderItem; timestamp: string };

export interface AppSettings {
  googleSheetUrl: string;
  spreadsheetId: string;
  spreadsheetTitle: string;
  lastSyncedAt: string | null;
  autoSyncEnabled: boolean;
}
