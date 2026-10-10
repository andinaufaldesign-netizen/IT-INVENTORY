import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db, verifyPassword, SECRET_CODE, InventoryCategory } from './server/db';
import {
  generateToken,
  requireAuth,
  AuthenticatedRequest,
  generateSecretToken,
  verifySecretToken,
} from './server/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Increase payload limit for photos
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded images statically
const UPLOADS_DIR = path.resolve(__dirname, 'data', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/api/uploads', express.static(UPLOADS_DIR));

// --- API ROUTES ---

// 1. Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const user = db.getUserByUsername(username);
  if (!user) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
    },
  });
});

// 2. Auth: Check current user session
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = db.getUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
    },
  });
});

// 3. User Management: Verify Secret Code
app.post('/api/auth/verify-secret', (req, res) => {
  const { secretCode } = req.body;
  if (!secretCode || typeof secretCode !== 'string') {
    res.status(400).json({ error: 'Secret code is required' });
    return;
  }

  if (secretCode.trim() !== SECRET_CODE) {
    // Exact requirement: "Invalid secret code. Please try again."
    res.status(403).json({ error: 'Invalid secret code. Please try again.' });
    return;
  }

  const secretToken = generateSecretToken();
  res.json({
    success: true,
    secretToken,
  });
});

// 4. User Management: Get list of users (User 1, User 2, User 3)
app.get('/api/users', (req, res) => {
  const secretToken = req.headers['x-secret-token'] as string;
  const authHeader = req.headers.authorization;

  const isSecretValid = secretToken && verifySecretToken(secretToken);
  let isAuthValid = false;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    isAuthValid = !!token;
  }

  if (!isSecretValid && !isAuthValid) {
    res.status(403).json({ error: 'Secret verification or authentication required' });
    return;
  }

  const users = db.getUsers().map((u, index) => ({
    id: u.id,
    label: `User ${index + 1}`,
    username: u.username,
    role: u.role,
    displayName: u.displayName,
    maskedPassword: '••••••••',
    updatedAt: u.updatedAt,
  }));

  res.json({ users });
});

// 5. User Management: Update credentials
app.post('/api/users/update', (req, res) => {
  const secretToken = req.headers['x-secret-token'] as string;
  if (!secretToken || !verifySecretToken(secretToken)) {
    res.status(403).json({ error: 'Invalid or expired secret session. Please verify again.' });
    return;
  }

  const { updates } = req.body; // Array of { id, username, password }
  if (!Array.isArray(updates) || updates.length === 0) {
    res.status(400).json({ error: 'Invalid updates payload' });
    return;
  }

  const results: any[] = [];
  for (const item of updates) {
    if (!item.id || !item.username) continue;
    const updated = db.updateUserCredentials(item.id, item.username, item.password);
    if (updated) {
      results.push({
        id: updated.id,
        username: updated.username,
        role: updated.role,
        updatedAt: updated.updatedAt,
      });
    }
  }

  res.json({
    success: true,
    message: 'User credentials updated successfully.',
    users: results,
  });
});

// 6. Photo Upload (saves base64 or binary image file to data/uploads)
app.post('/api/upload', requireAuth, (req, res) => {
  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl || !dataUrl.includes(',')) {
      res.status(400).json({ error: 'Invalid image data' });
      return;
    }

    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || matches.length < 3) {
      res.status(400).json({ error: 'Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP' });
      return;
    }

    const ext = matches[1].replace('jpeg', 'jpg');
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Security check: limit file size to 10MB
    if (buffer.length > 10 * 1024 * 1024) {
      res.status(400).json({ error: 'File size exceeds maximum allowed limit (10MB)' });
      return;
    }

    const safeName = `img_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
    const filePath = path.resolve(UPLOADS_DIR, safeName);
    fs.writeFileSync(filePath, buffer);

    const photoUrl = `/api/uploads/${safeName}`;
    res.json({
      success: true,
      url: photoUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image. Please try again.' });
  }
});

// 7. Inventory: Get all items
app.get('/api/inventory', requireAuth, (req, res) => {
  const items = db.getAllInventory();
  res.json({ inventory: items });
});

// 8. Inventory: Create new item
app.post('/api/inventory', requireAuth, (req: AuthenticatedRequest, res) => {
  const { itemName, quantity, photoUrl, category, dateRepaired, serialNumber } = req.body;

  // Validation
  if (!itemName || !itemName.trim()) {
    res.status(400).json({ error: 'Item name is required' });
    return;
  }

  if (!photoUrl || !photoUrl.trim()) {
    res.status(400).json({ error: 'Photo is required' });
    return;
  }

  const validCategories: InventoryCategory[] = ['PC ITEMS', 'NETWORK ITEMS', 'CCTV & TV ITEMS', 'ROOM ITEMS'];
  if (!validCategories.includes(category)) {
    res.status(400).json({ error: 'Invalid category. Must be PC ITEMS, NETWORK ITEMS, CCTV & TV ITEMS, or ROOM ITEMS' });
    return;
  }

  if (!dateRepaired || !/^\d{4}-\d{2}-\d{2}$/.test(dateRepaired)) {
    res.status(400).json({ error: 'Valid date repaired is required (YYYY-MM-DD)' });
    return;
  }

  const currentUser = req.user?.username || 'SYSTEM';
  const parsedQuantity = Math.max(1, parseInt(String(quantity || 1), 10) || 1);

  const newItem = db.createInventory({
    itemName: itemName.trim(),
    quantity: parsedQuantity,
    photoUrl: photoUrl.trim(),
    category,
    dateRepaired,
    serialNumber: serialNumber && serialNumber.trim() ? serialNumber.trim() : null,
    createdBy: currentUser,
    updatedBy: currentUser,
  });

  res.status(201).json({
    success: true,
    message: 'Inventory added successfully.',
    item: newItem,
  });
});

// 9. Inventory: Update item
app.put('/api/inventory/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { itemName, quantity, photoUrl, category, dateRepaired, serialNumber } = req.body;

  if (!itemName || !itemName.trim()) {
    res.status(400).json({ error: 'Item name is required' });
    return;
  }

  const validCategories: InventoryCategory[] = ['PC ITEMS', 'NETWORK ITEMS', 'CCTV & TV ITEMS', 'ROOM ITEMS'];
  if (category && !validCategories.includes(category)) {
    res.status(400).json({ error: 'Invalid category' });
    return;
  }

  const currentUser = req.user?.username || 'SYSTEM';
  const parsedQuantity = quantity !== undefined ? Math.max(1, parseInt(String(quantity), 10) || 1) : undefined;

  const updated = db.updateInventory(
    id,
    {
      itemName: itemName.trim(),
      ...(parsedQuantity !== undefined ? { quantity: parsedQuantity } : {}),
      ...(photoUrl ? { photoUrl: photoUrl.trim() } : {}),
      ...(category ? { category } : {}),
      ...(dateRepaired ? { dateRepaired } : {}),
      serialNumber: serialNumber && serialNumber.trim() ? serialNumber.trim() : null,
    },
    currentUser
  );

  if (!updated) {
    res.status(404).json({ error: 'Inventory item not found' });
    return;
  }

  res.json({
    success: true,
    message: 'Inventory updated successfully.',
    item: updated,
  });
});

// 10. Inventory: Delete item
app.delete('/api/inventory/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const currentUser = req.user?.username || 'SYSTEM';

  const success = db.deleteInventory(id, currentUser);
  if (!success) {
    res.status(404).json({ error: 'Inventory item not found' });
    return;
  }

  res.json({
    success: true,
    message: 'Inventory item deleted successfully.',
  });
});

// --- PURCHASE ORDER API ENDPOINTS ---

// 11. Purchase Orders: Get all items
app.get('/api/purchase-orders', requireAuth, (_req, res) => {
  const items = db.getAllPurchaseOrders();
  res.json({ purchaseOrders: items });
});

// 12. Purchase Orders: Get single item
app.get('/api/purchase-orders/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const item = db.getPurchaseOrderById(id);
  if (!item) {
    res.status(404).json({ error: 'Purchase Order not found' });
    return;
  }
  res.json({ purchaseOrder: item });
});

// 13. Purchase Orders: Create new item
app.post('/api/purchase-orders', requireAuth, (req: AuthenticatedRequest, res) => {
  const { itemName, photoUrl, orderDate, arrivalDate, quantity, forUse, remarks, status } = req.body;

  // Validations
  if (!itemName || !itemName.trim()) {
    res.status(400).json({ error: 'Item name is required' });
    return;
  }

  if (!photoUrl || !photoUrl.trim()) {
    res.status(400).json({ error: 'Item photo is required' });
    return;
  }

  if (!orderDate || !/^\d{4}-\d{2}-\d{2}$/.test(orderDate)) {
    res.status(400).json({ error: 'Valid order date is required (YYYY-MM-DD)' });
    return;
  }

  const parsedQty = parseInt(String(quantity), 10);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    res.status(400).json({ error: 'Quantity must be a positive whole number' });
    return;
  }

  const validStatuses = ['NOT ARRIVED', 'ARRIVED'];
  const finalStatus = validStatuses.includes(status) ? status : 'NOT ARRIVED';

  let formattedArrivalDate: string | null = null;
  if (arrivalDate && typeof arrivalDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(arrivalDate.trim())) {
    formattedArrivalDate = arrivalDate.trim();
  }

  const currentUser = req.user?.username || 'SYSTEM';

  const newItem = db.createPurchaseOrder({
    itemName: itemName.trim(),
    photoUrl: photoUrl.trim(),
    orderDate: orderDate.trim(),
    arrivalDate: formattedArrivalDate,
    quantity: parsedQty,
    forUse: forUse && typeof forUse === 'string' && forUse.trim() ? forUse.trim() : null,
    remarks: remarks && typeof remarks === 'string' && remarks.trim() ? remarks.trim() : null,
    status: finalStatus,
    createdBy: currentUser,
    updatedBy: currentUser,
  });

  res.status(201).json({
    success: true,
    message: 'Purchase Order added successfully.',
    item: newItem,
  });
});

// 14. Purchase Orders: Update item
app.put('/api/purchase-orders/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { itemName, photoUrl, orderDate, arrivalDate, quantity, forUse, remarks, status } = req.body;

  if (!itemName || !itemName.trim()) {
    res.status(400).json({ error: 'Item name is required' });
    return;
  }

  if (orderDate && !/^\d{4}-\d{2}-\d{2}$/.test(orderDate)) {
    res.status(400).json({ error: 'Valid order date is required (YYYY-MM-DD)' });
    return;
  }

  let parsedQty: number | undefined = undefined;
  if (quantity !== undefined) {
    const q = parseInt(String(quantity), 10);
    if (isNaN(q) || q <= 0) {
      res.status(400).json({ error: 'Quantity must be a positive whole number' });
      return;
    }
    parsedQty = q;
  }

  let formattedArrivalDate: string | null | undefined = undefined;
  if (arrivalDate !== undefined) {
    if (arrivalDate && typeof arrivalDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(arrivalDate.trim())) {
      formattedArrivalDate = arrivalDate.trim();
    } else {
      formattedArrivalDate = null;
    }
  }

  const validStatuses = ['NOT ARRIVED', 'ARRIVED'];
  let finalStatus: ('NOT ARRIVED' | 'ARRIVED') | undefined = undefined;
  if (status !== undefined) {
    if (validStatuses.includes(status)) {
      finalStatus = status;
    }
  }

  const currentUser = req.user?.username || 'SYSTEM';

  const updated = db.updatePurchaseOrder(
    id,
    {
      itemName: itemName.trim(),
      ...(photoUrl ? { photoUrl: photoUrl.trim() } : {}),
      ...(orderDate ? { orderDate: orderDate.trim() } : {}),
      ...(formattedArrivalDate !== undefined ? { arrivalDate: formattedArrivalDate } : {}),
      ...(parsedQty !== undefined ? { quantity: parsedQty } : {}),
      ...(forUse !== undefined ? { forUse: forUse && typeof forUse === 'string' && forUse.trim() ? forUse.trim() : null } : {}),
      ...(remarks !== undefined ? { remarks: remarks && typeof remarks === 'string' && remarks.trim() ? remarks.trim() : null } : {}),
      ...(finalStatus !== undefined ? { status: finalStatus } : {}),
    },
    currentUser
  );

  if (!updated) {
    res.status(404).json({ error: 'Purchase Order not found' });
    return;
  }

  res.json({
    success: true,
    message: 'Purchase Order updated successfully.',
    item: updated,
  });
});

// 15. Purchase Orders: Delete item
app.delete('/api/purchase-orders/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const currentUser = req.user?.username || 'SYSTEM';

  const success = db.deletePurchaseOrder(id, currentUser);
  if (!success) {
    res.status(404).json({ error: 'Purchase Order not found' });
    return;
  }

  res.json({
    success: true,
    message: 'Purchase Order deleted successfully.',
  });
});

// 16. Activity logs
app.get('/api/activity', requireAuth, (req, res) => {
  const action = req.query.action as string | undefined;
  const activities = db.getActivities(50, action);
  res.json({ activities });
});

// 17. System & Google Sheet Settings
app.get('/api/settings', requireAuth, (_req, res) => {
  const settings = db.getSettings();
  res.json({ settings });
});

app.post('/api/settings', requireAuth, (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json({ success: true, settings: updated });
});

// --- Server & Vite initialization ---
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HOTEL IT INVENTORY server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
