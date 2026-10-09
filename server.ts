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

  const validCategories: InventoryCategory[] = ['PC ITEMS', 'NETWORK ITEMS', 'CCTV & TV ITEMS'];
  if (!validCategories.includes(category)) {
    res.status(400).json({ error: 'Invalid category. Must be PC ITEMS, NETWORK ITEMS, or CCTV & TV ITEMS' });
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

  const validCategories: InventoryCategory[] = ['PC ITEMS', 'NETWORK ITEMS', 'CCTV & TV ITEMS'];
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

// 11. Activity logs
app.get('/api/activity', requireAuth, (req, res) => {
  const activities = db.getActivities(25);
  res.json({ activities });
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
