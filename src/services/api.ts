import { User, UserManagementItem, InventoryItem, ActivityLog, PurchaseOrderItem, AppSettings } from '../types';

const TOKEN_KEY = 'hotel_it_inventory_token';
const USER_KEY = 'hotel_it_inventory_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();
    }
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

// Auth API
export async function loginApi(username: string, password: string): Promise<{ token: string; user: User }> {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setStoredToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function checkSessionApi(): Promise<User> {
  const data = await apiFetch('/api/auth/me');
  setStoredUser(data.user);
  return data.user;
}

// User Management API
export async function verifySecretCodeApi(secretCode: string): Promise<{ secretToken: string }> {
  const data = await apiFetch('/api/auth/verify-secret', {
    method: 'POST',
    body: JSON.stringify({ secretCode }),
  });
  return data;
}

export async function fetchUsersApi(secretToken?: string): Promise<UserManagementItem[]> {
  const headers: Record<string, string> = {};
  if (secretToken) {
    headers['x-secret-token'] = secretToken;
  }
  const data = await apiFetch('/api/users', { headers });
  return data.users;
}

export async function updateUsersApi(
  secretToken: string,
  updates: Array<{ id: string; username: string; password?: string }>
): Promise<{ message: string; users: any[] }> {
  const data = await apiFetch('/api/users/update', {
    method: 'POST',
    headers: {
      'x-secret-token': secretToken,
    },
    body: JSON.stringify({ updates }),
  });
  return data;
}

// Inventory API
export async function fetchInventoryApi(): Promise<InventoryItem[]> {
  const data = await apiFetch('/api/inventory');
  return data.inventory;
}

export async function createInventoryApi(item: {
  itemName: string;
  quantity?: number;
  photoUrl: string;
  category: string;
  dateRepaired: string;
  serialNumber?: string | null;
}): Promise<InventoryItem> {
  const data = await apiFetch('/api/inventory', {
    method: 'POST',
    body: JSON.stringify(item),
  });
  return data.item;
}

export async function updateInventoryApi(
  id: string,
  item: {
    itemName: string;
    quantity?: number;
    photoUrl?: string;
    category?: string;
    dateRepaired?: string;
    serialNumber?: string | null;
  }
): Promise<InventoryItem> {
  const data = await apiFetch(`/api/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });
  return data.item;
}

export async function deleteInventoryApi(id: string): Promise<void> {
  await apiFetch(`/api/inventory/${id}`, {
    method: 'DELETE',
  });
}

// Purchase Orders API
export async function fetchPurchaseOrdersApi(): Promise<PurchaseOrderItem[]> {
  const data = await apiFetch('/api/purchase-orders');
  return data.purchaseOrders;
}

export async function createPurchaseOrderApi(item: {
  itemName: string;
  photoUrl: string;
  orderDate: string;
  arrivalDate?: string | null;
  quantity: number;
  forUse?: string | null;
  remarks?: string | null;
  status: 'NOT ARRIVED' | 'ARRIVED';
}): Promise<PurchaseOrderItem> {
  const data = await apiFetch('/api/purchase-orders', {
    method: 'POST',
    body: JSON.stringify(item),
  });
  return data.item;
}

export async function updatePurchaseOrderApi(
  id: string,
  item: {
    itemName: string;
    photoUrl?: string;
    orderDate?: string;
    arrivalDate?: string | null;
    quantity?: number;
    forUse?: string | null;
    remarks?: string | null;
    status?: 'NOT ARRIVED' | 'ARRIVED';
  }
): Promise<PurchaseOrderItem> {
  const data = await apiFetch(`/api/purchase-orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });
  return data.item;
}

export async function deletePurchaseOrderApi(id: string): Promise<void> {
  await apiFetch(`/api/purchase-orders/${id}`, {
    method: 'DELETE',
  });
}

// Upload Photo API
export async function uploadPhotoApi(dataUrl: string, filename = 'photo.jpg'): Promise<string> {
  const data = await apiFetch('/api/upload', {
    method: 'POST',
    body: JSON.stringify({ dataUrl, filename }),
  });
  return data.url;
}

// Activity Logs API (Only 'ADD' items per requirement)
export async function fetchActivityApi(action?: string): Promise<ActivityLog[]> {
  const url = action ? `/api/activity?action=${encodeURIComponent(action)}` : '/api/activity?action=ADD';
  const data = await apiFetch(url);
  return data.activities;
}

// Image Compression Helper (Client-side Canvas)
export function compressImage(file: File, maxWidth = 900, maxHeight = 900, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight = maxHeight;
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        // Smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Settings API
export async function fetchSettingsApi(): Promise<AppSettings> {
  const data = await apiFetch('/api/settings');
  return data.settings;
}

export async function updateSettingsApi(settings: Partial<AppSettings>): Promise<AppSettings> {
  const data = await apiFetch('/api/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
  return data.settings;
}
