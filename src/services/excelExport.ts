import ExcelJS from 'exceljs';
import { InventoryItem } from '../types';

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const t = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${d}, ${t}`;
  } catch {
    return dateStr;
  }
}

async function fetchImageBase64(url: string): Promise<{ base64: string; extension: 'jpeg' | 'png' } | null> {
  try {
    // If it's already a data URL
    if (url.startsWith('data:image/')) {
      const parts = url.split(',');
      const isPng = url.startsWith('data:image/png');
      return {
        base64: parts[1],
        extension: isPng ? 'png' : 'jpeg',
      };
    }

    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (!result) return resolve(null);
        const parts = result.split(',');
        const isPng = blob.type.includes('png');
        resolve({
          base64: parts[1],
          extension: isPng ? 'png' : 'jpeg',
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportInventoryToExcel(
  items: InventoryItem[],
  title: string,
  fileName: string,
  sheetName = 'INVENTORY'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HOTEL IT INVENTORY MANAGEMENT';
  workbook.lastModifiedBy = 'HOTEL IT INVENTORY';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create worksheet with safe tab name (max 31 chars, no special chars)
  const safeSheetName = sheetName.replace(/[:\\/?*\[\]]/g, ' ').substring(0, 30).trim();
  const worksheet = workbook.addWorksheet(safeSheetName, {
    views: [{ showGridLines: true }],
  });

  // Title styling
  worksheet.mergeCells('A1:J1');
  const titleRow1 = worksheet.getCell('A1');
  titleRow1.value = 'HOTEL IT INVENTORY';
  titleRow1.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF0F172A' } };
  titleRow1.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 28;

  worksheet.mergeCells('A2:J2');
  const titleRow2 = worksheet.getCell('A2');
  titleRow2.value = title.toUpperCase();
  titleRow2.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF2563EB' } };
  titleRow2.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 24;

  // Empty row
  worksheet.getRow(3).height = 10;

  // Header row at row 4
  const headerRowNumber = 4;
  const headers = [
    'No',
    'Foto',
    'Nama Barang',
    'Jumlah Barang',
    'Kategori',
    'Tanggal Dibereskan',
    'Serial Number',
    'Added By',
    'Last Edited By',
    'Last Updated',
  ];

  const headerRow = worksheet.getRow(headerRowNumber);
  headerRow.values = headers;
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Dark navy slate
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } },
    };
  });

  // Column widths
  worksheet.columns = [
    { key: 'no', width: 6 },
    { key: 'foto', width: 14 },
    { key: 'namaBarang', width: 34 },
    { key: 'jumlahBarang', width: 16 },
    { key: 'kategori', width: 20 },
    { key: 'tanggalDibereskan', width: 22 },
    { key: 'serialNumber', width: 22 },
    { key: 'addedBy', width: 16 },
    { key: 'lastEditedBy', width: 16 },
    { key: 'lastUpdated', width: 25 },
  ];

  // Freeze panes below header
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: true }];

  // Pre-load images in parallel
  const imagePromises = items.map((item) => (item.photoUrl ? fetchImageBase64(item.photoUrl) : Promise.resolve(null)));
  const loadedImages = await Promise.all(imagePromises);

  // Fill data rows
  let currentRowIndex = 5;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const row = worksheet.getRow(currentRowIndex);
    row.height = 54; // Sized for comfortable 45px thumbnail

    row.values = [
      i + 1,
      '', // Placeholder for image
      item.itemName,
      item.quantity || 1,
      item.category,
      formatDate(item.dateRepaired),
      item.serialNumber || '-',
      item.createdBy,
      item.updatedBy || item.createdBy,
      formatDateTime(item.updatedAt || item.createdAt),
    ];

    // Alignments and borders
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      } else if (colNumber === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2563EB' } };
      } else if (colNumber === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Zebra striping
      if (i % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }
    });

    // Embed image into cell B
    const imgData = loadedImages[i];
    if (imgData) {
      try {
        const imageId = workbook.addImage({
          base64: imgData.base64,
          extension: imgData.extension,
        });

        // Place image in column B (index 1 in 0-based col)
        worksheet.addImage(imageId, {
          tl: { col: 1.15, row: currentRowIndex - 1 + 0.1 },
          ext: { width: 50, height: 48 },
          editAs: 'oneCell',
        });
      } catch (err) {
        console.warn('Failed embedding image for item:', item.itemName, err);
      }
    }

    currentRowIndex++;
  }

  // Auto-filter
  worksheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: Math.max(currentRowIndex - 1, 4), column: 10 },
  };

  // Generate buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
