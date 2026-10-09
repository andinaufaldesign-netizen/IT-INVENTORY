import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: 'IT MANAGER' | 'IT ASSIST' | 'IT TRAINEE';
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryCategory = 'PC ITEMS' | 'NETWORK ITEMS' | 'CCTV & TV ITEMS';

export interface InventoryRecord {
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

export interface ActivityRecord {
  id: string;
  action: 'ADD' | 'EDIT' | 'DELETE';
  itemId?: string;
  itemName: string;
  category?: InventoryCategory;
  performedBy: string;
  timestamp: string;
  details?: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const USERS_FILE = path.resolve(DATA_DIR, 'users.json');
const INVENTORY_FILE = path.resolve(DATA_DIR, 'inventory.json');
const ACTIVITY_FILE = path.resolve(DATA_DIR, 'activity.json');

// Secret code for User Management: INNRATTAN.BJM
export const SECRET_CODE = 'INNRATTAN.BJM';

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

// Initial seed users: ITMANAGER / syah, ITASSIST / ihsan, ITTRAINEE / andi
function initUsers(): UserRecord[] {
  const user1 = hashPassword('syah');
  const user2 = hashPassword('ihsan');
  const user3 = hashPassword('andi');
  const now = new Date().toISOString();

  return [
    {
      id: 'user-1',
      username: 'ITMANAGER',
      passwordHash: user1.hash,
      salt: user1.salt,
      role: 'IT MANAGER',
      displayName: 'IT Manager',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-2',
      username: 'ITASSIST',
      passwordHash: user2.hash,
      salt: user2.salt,
      role: 'IT ASSIST',
      displayName: 'IT Assistant',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-3',
      username: 'ITTRAINEE',
      passwordHash: user3.hash,
      salt: user3.salt,
      role: 'IT TRAINEE',
      displayName: 'IT Trainee',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// Initial seed sample items with realistic hotel IT hardware
function initInventory(): InventoryRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'INV-2026-001',
      itemName: 'Dell OptiPlex 7090 Micro Desktop',
      quantity: 1,
      photoUrl: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=600&q=80',
      category: 'PC ITEMS',
      dateRepaired: '2026-10-05',
      serialNumber: 'DL-7090-8841B',
      createdAt: '2026-10-05T07:30:00.000Z',
      createdBy: 'ITMANAGER',
      updatedAt: '2026-10-08T14:35:00.000Z',
      updatedBy: 'ITASSIST',
    },
    {
      id: 'INV-2026-002',
      itemName: 'Cisco Catalyst 2960-X 24-Port Gigabit Switch',
      quantity: 2,
      photoUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
      category: 'NETWORK ITEMS',
      dateRepaired: '2026-08-14',
      serialNumber: 'CSCO-2960X-9902',
      createdAt: '2026-08-14T09:15:00.000Z',
      createdBy: 'ITASSIST',
      updatedAt: '2026-08-14T13:15:00.000Z',
      updatedBy: 'ITASSIST',
    },
    {
      id: 'INV-2026-003',
      itemName: 'Hikvision DS-2CD2143G0 Outdoor Dome Camera',
      quantity: 4,
      photoUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
      category: 'CCTV & TV ITEMS',
      dateRepaired: '2026-08-20',
      serialNumber: 'HKV-DOME-7721A',
      createdAt: '2026-08-20T11:00:00.000Z',
      createdBy: 'ITTRAINEE',
      updatedAt: '2026-08-20T11:00:00.000Z',
      updatedBy: 'ITTRAINEE',
    },
    {
      id: 'INV-2026-004',
      itemName: 'Samsung 43-inch Hospitality Smart TV (Guest Room Retur)',
      quantity: 1,
      photoUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80',
      category: 'CCTV & TV ITEMS',
      dateRepaired: '2026-09-02',
      serialNumber: 'SAM-HTV-4309X',
      createdAt: '2026-09-02T16:20:00.000Z',
      createdBy: 'ITTRAINEE',
      updatedAt: '2026-09-02T16:48:00.000Z',
      updatedBy: 'ITTRAINEE',
    },
    {
      id: 'INV-2026-005',
      itemName: 'Ubiquiti UniFi UAP-AC-PRO Access Point',
      quantity: 3,
      photoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
      category: 'NETWORK ITEMS',
      dateRepaired: '2026-10-02',
      serialNumber: 'UBNT-ACPRO-3310',
      createdAt: '2026-10-02T10:00:00.000Z',
      createdBy: 'ITMANAGER',
      updatedAt: '2026-10-02T10:00:00.000Z',
      updatedBy: 'ITMANAGER',
    },
    {
      id: 'INV-2026-006',
      itemName: 'HP ProDesk 400 G6 Core i5 POS Backoffice',
      quantity: 1,
      photoUrl: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=600&q=80',
      category: 'PC ITEMS',
      dateRepaired: '2026-07-28',
      serialNumber: 'HP-PD400-5542',
      createdAt: '2026-07-28T08:30:00.000Z',
      createdBy: 'ITASSIST',
      updatedAt: '2026-07-28T08:30:00.000Z',
      updatedBy: 'ITASSIST',
    },
  ];
}

function initActivity(): ActivityRecord[] {
  return [
    {
      id: 'act-1',
      action: 'EDIT',
      itemName: 'Dell OptiPlex 7090 Micro Desktop',
      category: 'PC ITEMS',
      performedBy: 'ITASSIST',
      timestamp: '2026-10-08T14:35:00.000Z',
      details: 'Repaired power supply and tested RAM',
    },
    {
      id: 'act-2',
      action: 'ADD',
      itemName: 'Ubiquiti UniFi UAP-AC-PRO Access Point',
      category: 'NETWORK ITEMS',
      performedBy: 'ITMANAGER',
      timestamp: '2026-10-02T10:00:00.000Z',
      details: 'Firmware reset and verified PoE port',
    },
    {
      id: 'act-3',
      action: 'ADD',
      itemName: 'Samsung 43-inch Hospitality Smart TV',
      category: 'CCTV & TV ITEMS',
      performedBy: 'ITTRAINEE',
      timestamp: '2026-09-02T16:48:00.000Z',
      details: 'Cleaned backlight connector and calibrated colors',
    },
    {
      id: 'act-4',
      action: 'ADD',
      itemName: 'Hikvision DS-2CD2143G0 Outdoor Dome Camera',
      category: 'CCTV & TV ITEMS',
      performedBy: 'ITTRAINEE',
      timestamp: '2026-08-20T11:00:00.000Z',
      details: 'Replaced dome glass and verified IR night vision',
    },
    {
      id: 'act-5',
      action: 'ADD',
      itemName: 'Cisco Catalyst 2960-X 24-Port Gigabit Switch',
      category: 'NETWORK ITEMS',
      performedBy: 'ITASSIST',
      timestamp: '2026-08-14T13:15:00.000Z',
      details: 'Replaced faulty fan module and wiped VLAN configs',
    },
  ];
}

export class Database {
  private users: UserRecord[] = [];
  private inventory: InventoryRecord[] = [];
  private activities: ActivityRecord[] = [];

  constructor() {
    ensureDirectories();
    this.load();
  }

  private load() {
    // Load Users
    if (!fs.existsSync(USERS_FILE)) {
      this.users = initUsers();
      this.saveUsers();
    } else {
      try {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        this.users = JSON.parse(raw);
      } catch {
        this.users = initUsers();
        this.saveUsers();
      }
    }

    // Load Inventory
    if (!fs.existsSync(INVENTORY_FILE)) {
      this.inventory = initInventory();
      this.saveInventory();
    } else {
      try {
        const raw = fs.readFileSync(INVENTORY_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.inventory = Array.isArray(parsed)
          ? parsed.map((item: any) => ({
              ...item,
              quantity: item.quantity && Number(item.quantity) > 0 ? Number(item.quantity) : 1,
            }))
          : initInventory();
      } catch {
        this.inventory = initInventory();
        this.saveInventory();
      }
    }

    // Load Activity
    if (!fs.existsSync(ACTIVITY_FILE)) {
      this.activities = initActivity();
      this.saveActivity();
    } else {
      try {
        const raw = fs.readFileSync(ACTIVITY_FILE, 'utf-8');
        this.activities = JSON.parse(raw);
      } catch {
        this.activities = initActivity();
        this.saveActivity();
      }
    }
  }

  private saveUsers() {
    fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2), 'utf-8');
  }

  private saveInventory() {
    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(this.inventory, null, 2), 'utf-8');
  }

  private saveActivity() {
    fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(this.activities, null, 2), 'utf-8');
  }

  // --- Users Methods ---
  getUsers(): UserRecord[] {
    return this.users;
  }

  getUserByUsername(username: string): UserRecord | undefined {
    return this.users.find((u) => u.username.toUpperCase() === username.trim().toUpperCase());
  }

  getUserById(id: string): UserRecord | undefined {
    return this.users.find((u) => u.id === id);
  }

  updateUserCredentials(id: string, newUsername: string, newPassword?: string): UserRecord | null {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;

    const user = this.users[idx];
    user.username = newUsername.trim();
    user.updatedAt = new Date().toISOString();

    if (newPassword && newPassword.trim().length > 0) {
      const hashed = hashPassword(newPassword.trim());
      user.passwordHash = hashed.hash;
      user.salt = hashed.salt;
    }

    this.users[idx] = user;
    this.saveUsers();
    return user;
  }

  // --- Inventory Methods ---
  getAllInventory(): InventoryRecord[] {
    return this.inventory;
  }

  getInventoryById(id: string): InventoryRecord | undefined {
    return this.inventory.find((i) => i.id === id);
  }

  createInventory(item: Omit<InventoryRecord, 'id' | 'createdAt' | 'updatedAt'>): InventoryRecord {
    const now = new Date().toISOString();
    const id = `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const record: InventoryRecord = {
      ...item,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // Prepend so newest is at the top
    this.inventory.unshift(record);
    this.saveInventory();

    // Add activity
    this.logActivity({
      action: 'ADD',
      itemId: record.id,
      itemName: record.itemName,
      category: record.category,
      performedBy: record.createdBy,
      timestamp: now,
      details: `Added new item (${record.category})`,
    });

    return record;
  }

  updateInventory(id: string, updates: Partial<Omit<InventoryRecord, 'id' | 'createdAt' | 'createdBy'>>, updatedBy: string): InventoryRecord | null {
    const idx = this.inventory.findIndex((i) => i.id === id);
    if (idx === -1) return null;

    const existing = this.inventory[idx];
    const now = new Date().toISOString();

    const updated: InventoryRecord = {
      ...existing,
      ...updates,
      updatedAt: now,
      updatedBy,
    };

    // Move to top of list as recently edited
    this.inventory.splice(idx, 1);
    this.inventory.unshift(updated);
    this.saveInventory();

    this.logActivity({
      action: 'EDIT',
      itemId: updated.id,
      itemName: updated.itemName,
      category: updated.category,
      performedBy: updatedBy,
      timestamp: now,
      details: `Updated inventory details`,
    });

    return updated;
  }

  deleteInventory(id: string, deletedBy: string): boolean {
    const idx = this.inventory.findIndex((i) => i.id === id);
    if (idx === -1) return false;

    const item = this.inventory[idx];
    this.inventory.splice(idx, 1);
    this.saveInventory();

    this.logActivity({
      action: 'DELETE',
      itemId: id,
      itemName: item.itemName,
      category: item.category,
      performedBy: deletedBy,
      timestamp: new Date().toISOString(),
      details: `Removed item from inventory`,
    });

    return true;
  }

  // --- Activity Methods ---
  private logActivity(activity: Omit<ActivityRecord, 'id'>) {
    const id = `act-${Date.now().toString(36)}`;
    this.activities.unshift({
      id,
      ...activity,
    });
    // Keep max 100 activities
    if (this.activities.length > 100) {
      this.activities = this.activities.slice(0, 100);
    }
    this.saveActivity();
  }

  getActivities(limit = 20): ActivityRecord[] {
    return this.activities.slice(0, limit);
  }
}

export const db = new Database();
