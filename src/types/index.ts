export type InventoryCategory = 'PC ITEMS' | 'NETWORK ITEMS' | 'CCTV & TV ITEMS';

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
