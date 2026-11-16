import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from './api';

// ─── Brand Colors ───────────────────────────────────────────────────────────
const ORANGE       = 'FFFF7A00';
const ORANGE_LIGHT = 'FFFFF3E6';
const ORANGE_PALE  = 'FFFFF9F0';
const WHITE        = 'FFFFFFFF';
const DARK         = 'FF1F2937';
const GRAY_500     = 'FF6B7280';
const GRAY_200     = 'FFE5E7EB';
const GREEN        = 'FF10B981';
const GREEN_LIGHT  = 'FFD1FAE5';
const RED          = 'FFEF4444';
const RED_LIGHT    = 'FFFEE2E2';
const BLUE         = 'FF3B82F6';
const BLUE_LIGHT   = 'FFDBEAFE';
const PURPLE       = 'FF8B5CF6';
const PURPLE_LIGHT = 'FFEDE9FE';

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const dateStr = (d: Date | string) =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const dateTimeStr = (d: Date | string) =>
  new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function applyHeaderRow(sheet: ExcelJS.Worksheet, row: number, colStart: number, colEnd: number) {
  for (let c = colStart; c <= colEnd; c++) {
    const cell = sheet.getCell(row, c);
    cell.font = { bold: true, color: { argb: WHITE }, size: 11, name: 'Segoe UI' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      bottom: { style: 'thin', color: { argb: GRAY_200 } },
    };
  }
}

function applyDataRow(sheet: ExcelJS.Worksheet, row: number, colStart: number, colEnd: number, isAlt: boolean) {
  for (let c = colStart; c <= colEnd; c++) {
    const cell = sheet.getCell(row, c);
    cell.font = { size: 10, name: 'Segoe UI', color: { argb: DARK } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    if (isAlt) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE_PALE } };
    }
    cell.border = {
      bottom: { style: 'hair', color: { argb: GRAY_200 } },
    };
  }
}

function addSheetTitle(sheet: ExcelJS.Worksheet, title: string, subtitle: string, colSpan: number) {
  // Row 1 — Main title
  sheet.mergeCells(1, 1, 1, colSpan);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `📊  ${title}`;
  titleCell.font = { bold: true, size: 16, color: { argb: DARK }, name: 'Segoe UI' };
  titleCell.alignment = { vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE_LIGHT } };
  sheet.getRow(1).height = 36;

  // Row 2 — Subtitle
  sheet.mergeCells(2, 1, 2, colSpan);
  const subCell = sheet.getCell(2, 1);
  subCell.value = subtitle;
  subCell.font = { size: 10, color: { argb: GRAY_500 }, italic: true, name: 'Segoe UI' };
  subCell.alignment = { vertical: 'middle' };
  sheet.getRow(2).height = 22;

  // Row 3 — Spacer
  sheet.getRow(3).height = 8;
}

function addKpiCard(sheet: ExcelJS.Worksheet, row: number, col: number, label: string, value: string, bgColor: string, fgColor: string) {
  const labelCell = sheet.getCell(row, col);
  labelCell.value = label;
  labelCell.font = { bold: true, size: 9, color: { argb: GRAY_500 }, name: 'Segoe UI' };
  labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
  labelCell.alignment = { vertical: 'middle', horizontal: 'center' };
  labelCell.border = { top: { style: 'medium', color: { argb: fgColor } } };

  const valCell = sheet.getCell(row + 1, col);
  valCell.value = value;
  valCell.font = { bold: true, size: 14, color: { argb: fgColor }, name: 'Segoe UI' };
  valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
  valCell.alignment = { vertical: 'middle', horizontal: 'center' };
  valCell.border = { bottom: { style: 'medium', color: { argb: fgColor } } };
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export async function exportFullReport(queryStart: string, queryEnd: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PosQ';
  wb.created = new Date();

  const params = new URLSearchParams();
  if (queryStart) params.append('startDate', queryStart);
  if (queryEnd) params.append('endDate', queryEnd);
  const qs = params.toString();

  // ── Fetch all data in parallel ──────────────────────────────────────────
  const [summaryRes, salesRes, cashflowRes, productsRes, shiftsRes] = await Promise.all([
    api.get(`/reports/summary?${qs}`),
    api.get(`/sales?${qs}`),
    api.get(`/cashflow?${qs}`),
    api.get('/products?activeOnly=false'),
    api.get(`/shifts?${qs}`),
  ]);

  const summary  = summaryRes.data.data;
  const sales    = salesRes.data.data;
  const cashflows = cashflowRes.data.data;
  const products = productsRes.data.data;
  const shifts   = shiftsRes.data.data;

  const periodLabel = `Periode: ${dateStr(queryStart)} — ${dateStr(queryEnd)}`;

  // ══════════════════════════════════════════════════════════════════════════
  //  SHEET 1 — RINGKASAN UMUM
  // ══════════════════════════════════════════════════════════════════════════
  const ws1 = wb.addWorksheet('Ringkasan Umum', {
    properties: { tabColor: { argb: ORANGE } }
  });

  addSheetTitle(ws1, 'RINGKASAN UMUM', `PosQ — ${periodLabel}  |  Diekspor: ${dateTimeStr(new Date())}`, 8);

  // KPI Cards (Row 5-6)
  ws1.getRow(4).height = 10;
  ws1.columns = Array(8).fill({ width: 20 });

  addKpiCard(ws1, 5, 1, 'PENDAPATAN', formatIDR(summary.summary.revenue || 0), GREEN_LIGHT, GREEN.slice(2));
  addKpiCard(ws1, 5, 2, 'LABA BERSIH', formatIDR(summary.summary.netRevenue || 0), GREEN_LIGHT, GREEN.slice(2));
  addKpiCard(ws1, 5, 3, 'PENGELUARAN', formatIDR(summary.summary.expense || 0), RED_LIGHT, RED.slice(2));
  addKpiCard(ws1, 5, 4, 'TRANSAKSI', String(summary.summary.transactions || 0), BLUE_LIGHT, BLUE.slice(2));
  addKpiCard(ws1, 5, 5, 'PRODUK TERJUAL', `${summary.summary.itemsSold || 0} item`, PURPLE_LIGHT, PURPLE.slice(2));
  const avgTrx = (summary.summary.revenue || 0) / (summary.summary.transactions || 1);
  addKpiCard(ws1, 5, 6, 'RATA-RATA TRX', formatIDR(avgTrx), ORANGE_LIGHT, ORANGE.slice(2));
  const margin = (summary.summary.revenue || 0) > 0 ? ((summary.summary.netRevenue || 0) / summary.summary.revenue * 100) : 0;
  addKpiCard(ws1, 5, 7, 'MARGIN (%)', `${margin.toFixed(1)}%`, ORANGE_LIGHT, ORANGE.slice(2));

  // ── Top Products Table ──────────────────────────────────────────────────
  let r = 8;
  ws1.mergeCells(r, 1, r, 4);
  const topTitle = ws1.getCell(r, 1);
  topTitle.value = '🏆 Produk Terlaris';
  topTitle.font = { bold: true, size: 13, color: { argb: DARK }, name: 'Segoe UI' };
  r++;
  
  ['No', 'Nama Produk', 'Qty Terjual', 'Pendapatan'].forEach((h, i) => {
    ws1.getCell(r, i + 1).value = h;
  });
  applyHeaderRow(ws1, r, 1, 4);
  r++;

  (summary.topProducts || []).forEach((p: any, idx: number) => {
    ws1.getCell(r, 1).value = idx + 1;
    ws1.getCell(r, 2).value = `${p.emoji || ''} ${p.name}`;
    ws1.getCell(r, 3).value = p.quantity;
    ws1.getCell(r, 4).value = p.revenue;
    ws1.getCell(r, 4).numFmt = '#,##0';
    applyDataRow(ws1, r, 1, 4, idx % 2 === 1);
    r++;
  });

  // ── Revenue Chart Data ──────────────────────────────────────────────────
  r += 2;
  ws1.mergeCells(r, 1, r, 4);
  const chartTitle = ws1.getCell(r, 1);
  chartTitle.value = '📈 Data Grafik Pendapatan Harian';
  chartTitle.font = { bold: true, size: 13, color: { argb: DARK }, name: 'Segoe UI' };
  r++;

  const chartHeaderRow = r;
  ['Tanggal', 'Pendapatan (Rp)'].forEach((h, i) => {
    ws1.getCell(r, i + 1).value = h;
  });
  applyHeaderRow(ws1, r, 1, 2);
  r++;

  const chartDataStart = r;
  (summary.chartData || []).forEach((d: any, idx: number) => {
    ws1.getCell(r, 1).value = dateStr(d.date);
    ws1.getCell(r, 2).value = d.revenue;
    ws1.getCell(r, 2).numFmt = '#,##0';
    applyDataRow(ws1, r, 1, 2, idx % 2 === 1);
    r++;
  });
  const chartDataEnd = r - 1;

  // Add a chart if we have data
  if (summary.chartData && summary.chartData.length > 0) {
    // ExcelJS doesn't have native chart support, so we add a visual note
    r += 1;
    ws1.mergeCells(r, 1, r, 4);
    const noteCell = ws1.getCell(r, 1);
    noteCell.value = '💡 Tip: Pilih data di atas, lalu Insert > Chart di Excel untuk membuat grafik otomatis';
    noteCell.font = { italic: true, size: 9, color: { argb: GRAY_500 }, name: 'Segoe UI' };
  }

  // ── Busiest Hours ──────────────────────────────────────────────────────
  r += 2;
  ws1.mergeCells(r, 1, r, 4);
  const hourTitle = ws1.getCell(r, 1);
  hourTitle.value = '⏰ Jam Ramai';
  hourTitle.font = { bold: true, size: 13, color: { argb: DARK }, name: 'Segoe UI' };
  r++;

  ['Jam', 'Jumlah Transaksi'].forEach((h, i) => {
    ws1.getCell(r, i + 1).value = h;
  });
  applyHeaderRow(ws1, r, 1, 2);
  r++;

  (summary.busiestHours || []).forEach((h: any, idx: number) => {
    ws1.getCell(r, 1).value = h.hour;
    ws1.getCell(r, 2).value = h.count;
    applyDataRow(ws1, r, 1, 2, idx % 2 === 1);
    r++;
  });

  // ── Payment Methods ────────────────────────────────────────────────────
  r += 2;
  ws1.mergeCells(r, 1, r, 4);
  const pmTitle = ws1.getCell(r, 1);
  pmTitle.value = '💳 Metode Pembayaran';
  pmTitle.font = { bold: true, size: 13, color: { argb: DARK }, name: 'Segoe UI' };
  r++;

  ['Metode', 'Transaksi', 'Pendapatan'].forEach((h, i) => {
    ws1.getCell(r, i + 1).value = h;
  });
  applyHeaderRow(ws1, r, 1, 3);
  r++;

  (summary.paymentMethods || []).forEach((pm: any, idx: number) => {
    ws1.getCell(r, 1).value = pm.method;
    ws1.getCell(r, 2).value = pm.transactions;
    ws1.getCell(r, 3).value = pm.revenue;
    ws1.getCell(r, 3).numFmt = '#,##0';
    applyDataRow(ws1, r, 1, 3, idx % 2 === 1);
    r++;
  });


  // ══════════════════════════════════════════════════════════════════════════
  //  SHEET 2 — CASHFLOW
  // ══════════════════════════════════════════════════════════════════════════
  const ws2 = wb.addWorksheet('Cashflow', {
    properties: { tabColor: { argb: GREEN.slice(2) } }
  });
  ws2.columns = [
    { width: 6 },
    { width: 22 },
    { width: 15 },
    { width: 25 },
    { width: 40 },
    { width: 20 },
  ];

  addSheetTitle(ws2, 'ARUS KAS (CASHFLOW)', `PosQ — ${periodLabel}`, 6);

  // Combine sales + cashflows
  let combined: any[] = [];
  (sales || []).forEach((s: any) => {
    if (s.status === 'PAID') {
      combined.push({
        tanggal: new Date(s.createdAt),
        jenis: 'Pemasukan (Penjualan)',
        deskripsi: `Invoice ${s.invoiceNumber} — ${s.cashier?.name || '-'}`,
        jumlah: s.total,
        type: 'INCOME',
        metode: s.paymentMethod,
      });
    }
  });
  (cashflows || []).forEach((c: any) => {
    combined.push({
      tanggal: new Date(c.date || c.createdAt),
      jenis: c.type === 'INCOME' ? 'Pemasukan (Manual)' : 'Pengeluaran (Manual)',
      deskripsi: c.description,
      jumlah: c.amount,
      type: c.type,
      metode: '-',
    });
  });
  combined.sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime());

  // Summary cards
  const totalIncome = combined.filter(c => c.type === 'INCOME').reduce((s, c) => s + c.jumlah, 0);
  const totalExpense = combined.filter(c => c.type === 'EXPENSE').reduce((s, c) => s + c.jumlah, 0);

  addKpiCard(ws2, 4, 1, '', '', WHITE, DARK);
  addKpiCard(ws2, 4, 2, 'TOTAL PEMASUKAN', formatIDR(totalIncome), GREEN_LIGHT, GREEN.slice(2));
  addKpiCard(ws2, 4, 3, 'TOTAL PENGELUARAN', formatIDR(totalExpense), RED_LIGHT, RED.slice(2));
  addKpiCard(ws2, 4, 4, 'SALDO BERSIH', formatIDR(totalIncome - totalExpense), BLUE_LIGHT, BLUE.slice(2));

  r = 7;
  ['No', 'Tanggal', 'Jenis', 'Metode Bayar', 'Deskripsi', 'Jumlah (Rp)'].forEach((h, i) => {
    ws2.getCell(r, i + 1).value = h;
  });
  applyHeaderRow(ws2, r, 1, 6);
  r++;

  combined.forEach((item, idx) => {
    ws2.getCell(r, 1).value = idx + 1;
    ws2.getCell(r, 2).value = dateTimeStr(item.tanggal);
    ws2.getCell(r, 3).value = item.jenis;
    ws2.getCell(r, 4).value = item.metode;
    ws2.getCell(r, 5).value = item.deskripsi;
    ws2.getCell(r, 6).value = item.type === 'INCOME' ? item.jumlah : -item.jumlah;
    ws2.getCell(r, 6).numFmt = '#,##0;[Red]-#,##0';
    // Color the amount cell
    const amountCell = ws2.getCell(r, 6);
    amountCell.font = { bold: true, size: 10, name: 'Segoe UI', color: { argb: item.type === 'INCOME' ? GREEN : RED } };
    applyDataRow(ws2, r, 1, 5, idx % 2 === 1);
    if (idx % 2 === 1) {
      amountCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE_PALE } };
    }
    r++;
  });

  // Total row
  ws2.mergeCells(r, 1, r, 5);
  ws2.getCell(r, 1).value = 'TOTAL SALDO BERSIH';
  ws2.getCell(r, 1).font = { bold: true, size: 11, color: { argb: WHITE }, name: 'Segoe UI' };
  ws2.getCell(r, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } };
  ws2.getCell(r, 1).alignment = { horizontal: 'right', vertical: 'middle' };
  ws2.getCell(r, 6).value = totalIncome - totalExpense;
  ws2.getCell(r, 6).numFmt = '#,##0';
  ws2.getCell(r, 6).font = { bold: true, size: 12, color: { argb: WHITE }, name: 'Segoe UI' };
  ws2.getCell(r, 6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } };


  // ══════════════════════════════════════════════════════════════════════════
  //  SHEET 3 — ANALITIK PENJUALAN
  // ══════════════════════════════════════════════════════════════════════════
  const ws3 = wb.addWorksheet('Analitik Penjualan', {
    properties: { tabColor: { argb: BLUE.slice(2) } }
  });
  ws3.columns = [
    { width: 6 },
    { width: 18 },
    { width: 18 },
    { width: 15 },
    { width: 18 },
    { width: 15 },
    { width: 20 },
    { width: 20 },
    { width: 15 },
  ];

  addSheetTitle(ws3, 'ANALITIK PENJUALAN', `PosQ — ${periodLabel}`, 9);

  // Detail per transaksi
  r = 4;
  ws3.mergeCells(r, 1, r, 6);
  ws3.getCell(r, 1).value = '📋 Detail Transaksi';
  ws3.getCell(r, 1).font = { bold: true, size: 13, color: { argb: DARK }, name: 'Segoe UI' };
  r++;

  ['No', 'Invoice', 'Tanggal', 'Kasir', 'Metode Bayar', 'Member', 'Subtotal', 'Diskon', 'Total'].forEach((h, i) => {
    ws3.getCell(r, i + 1).value = h;
  });
  applyHeaderRow(ws3, r, 1, 9);
  r++;

  const paidSales = (sales || []).filter((s: any) => s.status === 'PAID');
  paidSales.forEach((s: any, idx: number) => {
    ws3.getCell(r, 1).value = idx + 1;
    ws3.getCell(r, 2).value = s.invoiceNumber;
    ws3.getCell(r, 3).value = dateTimeStr(s.createdAt);
    ws3.getCell(r, 4).value = s.cashier?.name || '-';
    ws3.getCell(r, 5).value = s.paymentMethod;
    ws3.getCell(r, 6).value = s.member?.name || '-';
    ws3.getCell(r, 7).value = s.subtotal;
    ws3.getCell(r, 7).numFmt = '#,##0';
    ws3.getCell(r, 8).value = s.discountAmount || 0;
    ws3.getCell(r, 8).numFmt = '#,##0';
    ws3.getCell(r, 9).value = s.total;
    ws3.getCell(r, 9).numFmt = '#,##0';
    applyDataRow(ws3, r, 1, 9, idx % 2 === 1);
    r++;
  });

  // Total footer
  ws3.mergeCells(r, 1, r, 6);
  ws3.getCell(r, 1).value = 'TOTAL';
  ws3.getCell(r, 1).font = { bold: true, size: 11, color: { argb: WHITE }, name: 'Segoe UI' };
  ws3.getCell(r, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };
  ws3.getCell(r, 1).alignment = { horizontal: 'right', vertical: 'middle' };
  [7, 8, 9].forEach(c => {
    const total = paidSales.reduce((sum: number, s: any) => {
      if (c === 7) return sum + (s.subtotal || 0);
      if (c === 8) return sum + (s.discountAmount || 0);
      return sum + (s.total || 0);
    }, 0);
    ws3.getCell(r, c).value = total;
    ws3.getCell(r, c).numFmt = '#,##0';
    ws3.getCell(r, c).font = { bold: true, size: 11, color: { argb: WHITE }, name: 'Segoe UI' };
    ws3.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };
  });

  // ── Per-product breakdown ────────────────────────────────────────────
  r += 3;
  ws3.mergeCells(r, 1, r, 6);
  ws3.getCell(r, 1).value = '📦 Rincian Produk Terjual';
  ws3.getCell(r, 1).font = { bold: true, size: 13, color: { argb: DARK }, name: 'Segoe UI' };
  r++;

  // Aggregate sale items per product
  const productSalesMap: Record<string, { name: string, qty: number, revenue: number, hpp: number }> = {};
  paidSales.forEach((s: any) => {
    (s.items || []).forEach((item: any) => {
      const key = item.productId;
      if (!productSalesMap[key]) {
        productSalesMap[key] = { name: item.product?.name || item.productName || 'Unknown', qty: 0, revenue: 0, hpp: 0 };
      }
      productSalesMap[key].qty += item.quantity;
      productSalesMap[key].revenue += item.subtotal;
      productSalesMap[key].hpp += item.quantity * (item.unitHpp || 0);
    });
  });
  const productSalesList = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);

  ['No', 'Nama Produk', 'Qty', 'Pendapatan', 'HPP', 'Laba Kotor'].forEach((h, i) => {
    ws3.getCell(r, i + 1).value = h;
  });
  applyHeaderRow(ws3, r, 1, 6);
  r++;

  productSalesList.forEach((p, idx) => {
    ws3.getCell(r, 1).value = idx + 1;
    ws3.getCell(r, 2).value = p.name;
    ws3.getCell(r, 3).value = p.qty;
    ws3.getCell(r, 4).value = p.revenue;
    ws3.getCell(r, 4).numFmt = '#,##0';
    ws3.getCell(r, 5).value = p.hpp;
    ws3.getCell(r, 5).numFmt = '#,##0';
    ws3.getCell(r, 6).value = p.revenue - p.hpp;
    ws3.getCell(r, 6).numFmt = '#,##0';
    applyDataRow(ws3, r, 1, 6, idx % 2 === 1);
    r++;
  });


  // ══════════════════════════════════════════════════════════════════════════
  //  SHEET 4 — STOK PRODUK & STOCK OPNAME
  // ══════════════════════════════════════════════════════════════════════════
  const ws4 = wb.addWorksheet('Stok Produk', {
    properties: { tabColor: { argb: PURPLE.slice(2) } }
  });
  ws4.columns = [
    { width: 6 },
    { width: 28 },
    { width: 18 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
  ];

  addSheetTitle(ws4, 'STOK PRODUK & STOCK OPNAME', `PosQ — ${periodLabel}`, 8);

  // Summary cards
  const totalProducts = products.length;
  const activeProducts = products.filter((p: any) => p.isActive).length;
  const lowStockProducts = products.filter((p: any) => p.stock !== null && p.stock <= 10 && p.isActive).length;
  const outOfStock = products.filter((p: any) => p.stock !== null && p.stock <= 0 && p.isActive).length;

  addKpiCard(ws4, 4, 1, '', '', WHITE, DARK);
  addKpiCard(ws4, 4, 2, 'TOTAL PRODUK', String(totalProducts), BLUE_LIGHT, BLUE.slice(2));
  addKpiCard(ws4, 4, 3, 'PRODUK AKTIF', String(activeProducts), GREEN_LIGHT, GREEN.slice(2));
  addKpiCard(ws4, 4, 4, 'STOK RENDAH (≤10)', String(lowStockProducts), ORANGE_LIGHT, ORANGE.slice(2));
  addKpiCard(ws4, 4, 5, 'HABIS', String(outOfStock), RED_LIGHT, RED.slice(2));

  r = 7;
  ws4.mergeCells(r, 1, r, 6);
  ws4.getCell(r, 1).value = '📦 Daftar Seluruh Produk';
  ws4.getCell(r, 1).font = { bold: true, size: 13, color: { argb: DARK }, name: 'Segoe UI' };
  r++;

  ['No', 'Nama Produk', 'Kategori', 'Harga', 'HPP', 'Stok', 'Status', 'Keterangan Stok'].forEach((h, i) => {
    ws4.getCell(r, i + 1).value = h;
  });
  applyHeaderRow(ws4, r, 1, 8);
  r++;

  products
    .sort((a: any, b: any) => {
      // Sort: out of stock first, then low stock, then normal
      const stockA = a.stock === null ? 9999 : a.stock;
      const stockB = b.stock === null ? 9999 : b.stock;
      return stockA - stockB;
    })
    .forEach((p: any, idx: number) => {
      ws4.getCell(r, 1).value = idx + 1;
      ws4.getCell(r, 2).value = `${p.emoji || ''} ${p.name}`;
      ws4.getCell(r, 3).value = p.category?.name || '-';
      ws4.getCell(r, 4).value = p.price;
      ws4.getCell(r, 4).numFmt = '#,##0';
      ws4.getCell(r, 5).value = p.hpp || 0;
      ws4.getCell(r, 5).numFmt = '#,##0';
      ws4.getCell(r, 6).value = p.stock !== null && p.stock !== undefined ? p.stock : '∞';
      ws4.getCell(r, 7).value = p.isActive ? 'Aktif' : 'Nonaktif';
      
      // Stock status indicator
      let stockStatus = '✅ Aman';
      let statusColor = GREEN;
      if (p.stock !== null && p.stock !== undefined) {
        if (p.stock <= 0) { stockStatus = '🔴 Habis'; statusColor = RED; }
        else if (p.stock <= 5) { stockStatus = '🟡 Kritis'; statusColor = RED; }
        else if (p.stock <= 10) { stockStatus = '🟠 Rendah'; statusColor = ORANGE; }
      } else {
        stockStatus = '♾️ Unlimited';
      }
      ws4.getCell(r, 8).value = stockStatus;
      ws4.getCell(r, 8).font = { bold: true, size: 10, color: { argb: statusColor }, name: 'Segoe UI' };
      
      applyDataRow(ws4, r, 1, 7, idx % 2 === 1);
      r++;
    });

  // ── Stock Opname Section ────────────────────────────────────────────────
  r += 2;
  ws4.mergeCells(r, 1, r, 6);
  ws4.getCell(r, 1).value = '📋 Stock Opname — Perbandingan Stok Sistem vs Terjual';
  ws4.getCell(r, 1).font = { bold: true, size: 13, color: { argb: DARK }, name: 'Segoe UI' };
  r++;

  ['No', 'Nama Produk', 'Stok Saat Ini', 'Terjual (Periode)', 'Nilai Stok (Rp)', 'Nilai Terjual (Rp)'].forEach((h, i) => {
    ws4.getCell(r, i + 1).value = h;
  });
  applyHeaderRow(ws4, r, 1, 6);
  r++;

  let totalStockValue = 0;
  let totalSoldValue = 0;

  products
    .filter((p: any) => p.isActive)
    .forEach((p: any, idx: number) => {
      const soldData = productSalesMap[p.id];
      const qtySold = soldData?.qty || 0;
      const stockVal = (p.stock || 0) * (p.hpp || p.price);
      const soldVal = soldData?.revenue || 0;
      totalStockValue += stockVal;
      totalSoldValue += soldVal;

      ws4.getCell(r, 1).value = idx + 1;
      ws4.getCell(r, 2).value = `${p.emoji || ''} ${p.name}`;
      ws4.getCell(r, 3).value = p.stock !== null && p.stock !== undefined ? p.stock : '∞';
      ws4.getCell(r, 4).value = qtySold;
      ws4.getCell(r, 5).value = stockVal;
      ws4.getCell(r, 5).numFmt = '#,##0';
      ws4.getCell(r, 6).value = soldVal;
      ws4.getCell(r, 6).numFmt = '#,##0';
      applyDataRow(ws4, r, 1, 6, idx % 2 === 1);
      r++;
    });

  // Total
  ws4.mergeCells(r, 1, r, 4);
  ws4.getCell(r, 1).value = 'TOTAL NILAI';
  ws4.getCell(r, 1).font = { bold: true, size: 11, color: { argb: WHITE }, name: 'Segoe UI' };
  ws4.getCell(r, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PURPLE.slice(2) } };
  ws4.getCell(r, 1).alignment = { horizontal: 'right', vertical: 'middle' };
  ws4.getCell(r, 5).value = totalStockValue;
  ws4.getCell(r, 5).numFmt = '#,##0';
  ws4.getCell(r, 5).font = { bold: true, size: 11, color: { argb: WHITE }, name: 'Segoe UI' };
  ws4.getCell(r, 5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PURPLE.slice(2) } };
  ws4.getCell(r, 6).value = totalSoldValue;
  ws4.getCell(r, 6).numFmt = '#,##0';
  ws4.getCell(r, 6).font = { bold: true, size: 11, color: { argb: WHITE }, name: 'Segoe UI' };
  ws4.getCell(r, 6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PURPLE.slice(2) } };


  // ══════════════════════════════════════════════════════════════════════════
  //  SHEET 5 — SHIFT (BUKA/TUTUP KASIR)
  // ══════════════════════════════════════════════════════════════════════════
  const ws5 = wb.addWorksheet('Laporan Shift', {
    properties: { tabColor: { argb: '00B4D8' } }
  });
  ws5.columns = [
    { width: 6 },
    { width: 22 },
    { width: 22 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 16 },
    { width: 14 },
  ];

  addSheetTitle(ws5, 'LAPORAN SHIFT (BUKA/TUTUP KASIR)', `PosQ — ${periodLabel}`, 9);

  // Summary
  const totalShifts = (shifts || []).length;
  const closedShifts = (shifts || []).filter((s: any) => s.status === 'CLOSED').length;
  const activeShifts = totalShifts - closedShifts;

  addKpiCard(ws5, 4, 1, '', '', WHITE, DARK);
  addKpiCard(ws5, 4, 2, 'TOTAL SHIFT', String(totalShifts), BLUE_LIGHT, BLUE.slice(2));
  addKpiCard(ws5, 4, 3, 'SELESAI', String(closedShifts), GREEN_LIGHT, GREEN.slice(2));
  addKpiCard(ws5, 4, 4, 'MASIH AKTIF', String(activeShifts), ORANGE_LIGHT, ORANGE.slice(2));

  r = 7;
  ['No', 'Waktu Buka', 'Waktu Tutup', 'Kasir', 'Modal Awal', 'Total Penjualan', 'Uang Fisik Akhir', 'Selisih', 'Status'].forEach((h, i) => {
    ws5.getCell(r, i + 1).value = h;
  });
  applyHeaderRow(ws5, r, 1, 9);
  r++;

  (shifts || []).forEach((shift: any, idx: number) => {
    const shiftSales = shift.endBalance ? shift.endBalance - shift.startBalance : 0;
    const difference = shift.status === 'CLOSED' ? (shift.actualBalance || 0) - (shift.endBalance || 0) : null;

    ws5.getCell(r, 1).value = idx + 1;
    ws5.getCell(r, 2).value = dateTimeStr(shift.startTime);
    ws5.getCell(r, 3).value = shift.endTime ? dateTimeStr(shift.endTime) : '-';
    ws5.getCell(r, 4).value = shift.cashier?.name || '-';
    ws5.getCell(r, 5).value = shift.startBalance;
    ws5.getCell(r, 5).numFmt = '#,##0';
    ws5.getCell(r, 6).value = shift.status === 'CLOSED' ? shiftSales : '-';
    if (typeof ws5.getCell(r, 6).value === 'number') ws5.getCell(r, 6).numFmt = '#,##0';
    ws5.getCell(r, 7).value = shift.status === 'CLOSED' && shift.actualBalance !== null ? shift.actualBalance : '-';
    if (typeof ws5.getCell(r, 7).value === 'number') ws5.getCell(r, 7).numFmt = '#,##0';
    
    if (difference !== null) {
      ws5.getCell(r, 8).value = difference;
      ws5.getCell(r, 8).numFmt = '#,##0';
      ws5.getCell(r, 8).font = {
        bold: true, size: 10, name: 'Segoe UI',
        color: { argb: difference >= 0 ? GREEN : RED }
      };
    } else {
      ws5.getCell(r, 8).value = '-';
    }
    
    ws5.getCell(r, 9).value = shift.status === 'CLOSED' ? '✅ Ditutup' : '🟠 Aktif';
    applyDataRow(ws5, r, 1, 9, idx % 2 === 1);
    r++;
  });


  // ══════════════════════════════════════════════════════════════════════════
  //  SHEET 6 — GRAFIK DATA (for charting in Excel)
  // ══════════════════════════════════════════════════════════════════════════
  const ws6 = wb.addWorksheet('Data Grafik', {
    properties: { tabColor: { argb: 'F59E0B' } }
  });
  ws6.columns = [
    { width: 18 },
    { width: 18 },
    { width: 5 },
    { width: 18 },
    { width: 18 },
    { width: 5 },
    { width: 18 },
    { width: 18 },
  ];

  addSheetTitle(ws6, 'DATA UNTUK GRAFIK', 'Pilih data di bawah, lalu Insert > Chart di Excel untuk membuat grafik', 8);

  r = 4;
  // Chart 1: Revenue per day
  ws6.getCell(r, 1).value = '📈 Pendapatan Harian';
  ws6.getCell(r, 1).font = { bold: true, size: 12, color: { argb: DARK }, name: 'Segoe UI' };
  r++;
  ws6.getCell(r, 1).value = 'Tanggal';
  ws6.getCell(r, 2).value = 'Pendapatan';
  applyHeaderRow(ws6, r, 1, 2);
  r++;
  (summary.chartData || []).forEach((d: any, idx: number) => {
    ws6.getCell(r, 1).value = dateStr(d.date);
    ws6.getCell(r, 2).value = d.revenue;
    ws6.getCell(r, 2).numFmt = '#,##0';
    applyDataRow(ws6, r, 1, 2, idx % 2 === 1);
    r++;
  });

  // Chart 2: Top Products
  r += 2;
  ws6.getCell(r, 1).value = '🏆 Produk Terlaris';
  ws6.getCell(r, 1).font = { bold: true, size: 12, color: { argb: DARK }, name: 'Segoe UI' };
  r++;
  ws6.getCell(r, 1).value = 'Produk';
  ws6.getCell(r, 2).value = 'Qty Terjual';
  applyHeaderRow(ws6, r, 1, 2);
  r++;
  (summary.topProducts || []).forEach((p: any, idx: number) => {
    ws6.getCell(r, 1).value = p.name;
    ws6.getCell(r, 2).value = p.quantity;
    applyDataRow(ws6, r, 1, 2, idx % 2 === 1);
    r++;
  });

  // Chart 3: Payment Methods
  r += 2;
  ws6.getCell(r, 1).value = '💳 Metode Pembayaran';
  ws6.getCell(r, 1).font = { bold: true, size: 12, color: { argb: DARK }, name: 'Segoe UI' };
  r++;
  ws6.getCell(r, 1).value = 'Metode';
  ws6.getCell(r, 2).value = 'Pendapatan';
  applyHeaderRow(ws6, r, 1, 2);
  r++;
  (summary.paymentMethods || []).forEach((pm: any, idx: number) => {
    ws6.getCell(r, 1).value = pm.method;
    ws6.getCell(r, 2).value = pm.revenue;
    ws6.getCell(r, 2).numFmt = '#,##0';
    applyDataRow(ws6, r, 1, 2, idx % 2 === 1);
    r++;
  });

  // Chart 4: Busiest Hours
  r += 2;
  ws6.getCell(r, 1).value = '⏰ Jam Ramai';
  ws6.getCell(r, 1).font = { bold: true, size: 12, color: { argb: DARK }, name: 'Segoe UI' };
  r++;
  ws6.getCell(r, 1).value = 'Jam';
  ws6.getCell(r, 2).value = 'Jumlah Transaksi';
  applyHeaderRow(ws6, r, 1, 2);
  r++;
  (summary.busiestHours || []).forEach((h: any, idx: number) => {
    ws6.getCell(r, 1).value = h.hour;
    ws6.getCell(r, 2).value = h.count;
    applyDataRow(ws6, r, 1, 2, idx % 2 === 1);
    r++;
  });


  // ── Generate & Download ─────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `Laporan_PosQ_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, fileName);
}
