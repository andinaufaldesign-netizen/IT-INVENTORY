import { InventoryItem, PurchaseOrderItem } from '../types';

/**
 * Extracts spreadsheet ID from full Google Sheet URL or returns clean ID
 */
export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Pattern for Google Sheet URL: /d/([a-zA-Z0-9-_]+)
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // If user pasted raw ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Fetches basic metadata of the spreadsheet
 */
export async function getSpreadsheetDetails(
  spreadsheetId: string,
  accessToken: string
): Promise<{ title: string; sheets: string[] }> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message =
      errorBody?.error?.message ||
      `Gagal mengakses spreadsheet (${res.status}: ${res.statusText})`;
    throw new Error(message);
  }

  const data = await res.json();
  const title = data.properties?.title || 'DATABASE APLIKASI IT';
  const sheets: string[] = (data.sheets || []).map(
    (s: any) => s.properties?.title
  );

  return { title, sheets };
}

/**
 * Ensures both INVENTORY and PURCHASE_ORDERS tabs exist in spreadsheet
 */
export async function ensureSpreadsheetTabs(
  spreadsheetId: string,
  accessToken: string,
  existingSheets: string[]
): Promise<void> {
  const requests: any[] = [];

  if (!existingSheets.includes('INVENTORY')) {
    requests.push({
      addSheet: {
        properties: {
          title: 'INVENTORY',
          gridProperties: {
            frozenRowCount: 1,
          },
          tabColor: {
            red: 0.14,
            green: 0.38,
            blue: 0.92,
          },
        },
      },
    });
  }

  if (!existingSheets.includes('PURCHASE_ORDERS')) {
    requests.push({
      addSheet: {
        properties: {
          title: 'PURCHASE_ORDERS',
          gridProperties: {
            frozenRowCount: 1,
          },
          tabColor: {
            red: 0.05,
            green: 0.6,
            blue: 0.4,
          },
        },
      },
    });
  }

  if (requests.length > 0) {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('Could not auto-add sheets via batchUpdate:', err);
    }
  }
}

/**
 * Pushes all INVENTORY and PURCHASE ORDERS data to Google Spreadsheet
 */
export async function syncAllToGoogleSheet(
  spreadsheetId: string,
  accessToken: string,
  inventory: InventoryItem[],
  purchaseOrders: PurchaseOrderItem[]
): Promise<{ inventoryRows: number; poRows: number }> {
  // 1. Check & prepare tabs
  const meta = await getSpreadsheetDetails(spreadsheetId, accessToken);
  await ensureSpreadsheetTabs(spreadsheetId, accessToken, meta.sheets);

  // 2. Prepare Inventory Table Data
  const inventoryHeaders = [
    'ID Barang',
    'No',
    'Nama Barang',
    'Jumlah Barang (Qty)',
    'Kategori',
    'Tanggal Dibereskan',
    'Serial Number',
    'Foto URL',
    'Ditambahkan Oleh',
    'Diedit Terakhir Oleh',
    'Waktu Dibuat',
    'Waktu Diperbarui',
  ];

  const inventoryRows = inventory.map((item, idx) => [
    item.id,
    idx + 1,
    item.itemName,
    item.quantity || 1,
    item.category,
    item.dateRepaired,
    item.serialNumber || '-',
    item.photoUrl || '-',
    item.createdBy,
    item.updatedBy || item.createdBy,
    item.createdAt,
    item.updatedAt,
  ]);

  const inventoryValues = [inventoryHeaders, ...inventoryRows];

  // 3. Prepare Purchase Orders Table Data
  const poHeaders = [
    'ID Order',
    'No',
    'Nama Barang',
    'Jumlah Unit',
    'Tanggal Pesan (Order Date)',
    'Tanggal Datang (Arrival Date)',
    'Status Order',
    'Peruntukan (For Use)',
    'Catatan (Remarks)',
    'Foto URL',
    'Ditambahkan Oleh',
    'Diedit Terakhir Oleh',
    'Waktu Dibuat',
    'Waktu Diperbarui',
  ];

  const poRows = purchaseOrders.map((po, idx) => [
    po.id,
    idx + 1,
    po.itemName,
    po.quantity || 1,
    po.orderDate,
    po.arrivalDate || '-',
    po.status === 'ARRIVED' ? 'SUDAH DATANG' : 'BELUM DATANG',
    po.forUse || '-',
    po.remarks || '-',
    po.photoUrl || '-',
    po.createdBy,
    po.updatedBy || po.createdBy,
    po.createdAt,
    po.updatedAt,
  ]);

  const poValues = [poHeaders, ...poRows];

  // 4. Clear old data & write new data to both tabs using batchUpdate values
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: 'INVENTORY!A1:L',
            values: inventoryValues,
          },
          {
            range: 'PURCHASE_ORDERS!A1:N',
            values: poValues,
          },
        ],
      }),
    }
  );

  if (!writeRes.ok) {
    const err = await writeRes.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || 'Gagal menulis data ke Google Spreadsheet.'
    );
  }

  return {
    inventoryRows: inventory.length,
    poRows: purchaseOrders.length,
  };
}

/**
 * Reads inventory and purchase order rows from Google Spreadsheet
 */
export async function pullDataFromGoogleSheet(
  spreadsheetId: string,
  accessToken: string
): Promise<{
  inventory: Array<{
    itemName: string;
    quantity: number;
    category: string;
    dateRepaired: string;
    serialNumber?: string | null;
    photoUrl: string;
  }>;
  purchaseOrders: Array<{
    itemName: string;
    quantity: number;
    orderDate: string;
    arrivalDate?: string | null;
    status: 'ARRIVED' | 'NOT ARRIVED';
    forUse?: string | null;
    remarks?: string | null;
    photoUrl: string;
  }>;
}> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=INVENTORY!A2:L&ranges=PURCHASE_ORDERS!A2:N`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal membaca data dari Google Spreadsheet.');
  }

  const data = await res.json();
  const valueRanges = data.valueRanges || [];

  const rawInventoryRows = valueRanges[0]?.values || [];
  const rawPORows = valueRanges[1]?.values || [];

  const inventory = rawInventoryRows
    .filter((row: any[]) => row && row[2]) // row[2] is Nama Barang
    .map((row: any[]) => ({
      itemName: String(row[2] || '').trim(),
      quantity: Math.max(1, parseInt(String(row[3] || '1'), 10) || 1),
      category: String(row[4] || 'PC ITEMS').trim(),
      dateRepaired: String(row[5] || new Date().toISOString().split('T')[0]).trim(),
      serialNumber: row[6] && row[6] !== '-' ? String(row[6]).trim() : null,
      photoUrl: String(row[7] || '').trim(),
    }));

  const purchaseOrders = rawPORows
    .filter((row: any[]) => row && row[2]) // row[2] is Nama Barang
    .map((row: any[]) => ({
      itemName: String(row[2] || '').trim(),
      quantity: Math.max(1, parseInt(String(row[3] || '1'), 10) || 1),
      orderDate: String(row[4] || new Date().toISOString().split('T')[0]).trim(),
      arrivalDate: row[5] && row[5] !== '-' ? String(row[5]).trim() : null,
      status: String(row[6] || '').includes('SUDAH') ? ('ARRIVED' as const) : ('NOT ARRIVED' as const),
      forUse: row[7] && row[7] !== '-' ? String(row[7]).trim() : null,
      remarks: row[8] && row[8] !== '-' ? String(row[8]).trim() : null,
      photoUrl: String(row[9] || '').trim(),
    }));

  return { inventory, purchaseOrders };
}
