
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { format } from "date-fns";
import { 
  Printer, 
  Eye, 
  X, 
  LogOut, 
  Download, 
  Filter, 
  Search, 
  RotateCcw,
  Receipt,
  TrendingUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { useRouter } from '@/lib/routerCompat';
import toast from "react-hot-toast";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { offlineStorage } from "../../lib/offlineStorage";

const MONTHS = [
  { value: "ALL", label: "Semua Bulan" },
  { value: "0", label: "Januari" },
  { value: "1", label: "Februari" },
  { value: "2", label: "Maret" },
  { value: "3", label: "April" },
  { value: "4", label: "Mei" },
  { value: "5", label: "Juni" },
  { value: "6", label: "Juli" },
  { value: "7", label: "Agustus" },
  { value: "8", label: "September" },
  { value: "9", label: "Oktober" },
  { value: "10", label: "November" },
  { value: "11", label: "Desember" },
];

interface TransactionHistoryViewProps {
  showTitle?: boolean;
  showLogout?: boolean;
  showExportExcel?: boolean;
  showKpiCards?: boolean;
  showFilters?: boolean;
  subTitle?: string;
}

export default function TransactionHistoryView({
  showTitle = true,
  showLogout = true,
  showExportExcel = true,
  showKpiCards = true,
  showFilters = true,
  subTitle,
}: TransactionHistoryViewProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 20;

  const queryClient = useQueryClient();
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const res = await api.get("/sales");
      return res.data.data || [];
    },
  });

  // Generate Year options dynamically from data + current year
  const yearOptions = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentYear);
    yearsSet.add(currentYear - 1);
    yearsSet.add(currentYear + 1);

    sales.forEach((s: any) => {
      if (s.createdAt) {
        yearsSet.add(new Date(s.createdAt).getFullYear());
      }
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [sales, currentYear]);

  // Filter Sales (only filter when showFilters is enabled)
  const filteredSales = useMemo(() => {
    if (!showFilters) {
      return sales;
    }

    return sales.filter((sale: any) => {
      const saleDate = new Date(sale.createdAt);

      if (selectedMonth !== "ALL" && saleDate.getMonth().toString() !== selectedMonth) {
        return false;
      }

      if (selectedYear !== "ALL" && saleDate.getFullYear().toString() !== selectedYear) {
        return false;
      }

      if (selectedMethod !== "ALL" && sale.paymentMethod !== selectedMethod) {
        return false;
      }

      if (selectedStatus !== "ALL" && sale.status !== selectedStatus) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const invoiceMatch = sale.invoiceNumber?.toLowerCase().includes(q);
        const cashierMatch = sale.cashier?.name?.toLowerCase().includes(q);
        const memberMatch = sale.member?.name?.toLowerCase().includes(q);
        const customerMatch = sale.customerName?.toLowerCase().includes(q);
        if (!invoiceMatch && !cashierMatch && !memberMatch && !customerMatch) {
          return false;
        }
      }

      return true;
    });
  }, [sales, showFilters, selectedMonth, selectedYear, selectedMethod, selectedStatus, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, selectedMethod, selectedStatus, searchQuery]);

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE) || 1;

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSales.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSales, currentPage, ITEMS_PER_PAGE]);

  // Filter Summary Stats
  const totalAmount = useMemo(() => {
    return filteredSales
      .filter((s: any) => s.status === "PAID")
      .reduce((sum: number, s: any) => sum + (s.total || 0), 0);
  }, [filteredSales]);

  const totalDiscount = useMemo(() => {
    return filteredSales
      .filter((s: any) => s.status === "PAID")
      .reduce((sum: number, s: any) => sum + (s.discountAmount || 0), 0);
  }, [filteredSales]);

  const formatIDR = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const resetFilters = () => {
    setSelectedMonth("ALL");
    setSelectedYear("ALL");
    setSelectedMethod("ALL");
    setSelectedStatus("ALL");
    setSearchQuery("");
  };

  const handleDeleteSale = async () => {
    if (!selectedSale) return;
    try {
      setIsDeleting(true);
      if (selectedSale.isOffline || selectedSale.offlineTempId) {
        offlineStorage.removeSaleFromQueue(selectedSale.offlineTempId || selectedSale.id);
      } else {
        await api.delete(`/sales/${selectedSale.id}`);
      }
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Transaksi berhasil dihapus");
      setIsDeleteModalOpen(false);
      setIsModalOpen(false);
      setSelectedSale(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Gagal menghapus transaksi");
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = async () => {
    if (filteredSales.length === 0) {
      toast.error("Tidak ada data transaksi untuk diekspor");
      return;
    }

    try {
      setIsExporting(true);
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "PosQ System";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Laporan Transaksi");

      const monthLabel = selectedMonth !== "ALL" ? MONTHS.find(m => m.value === selectedMonth)?.label : "Semua Bulan";
      const yearLabel = selectedYear !== "ALL" ? selectedYear : "Semua Tahun";

      worksheet.mergeCells("A1:K1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "LAPORAN TRANSAKSI PENJUALAN - POSQ";
      titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getRow(1).height = 32;

      worksheet.mergeCells("A2:K2");
      const subTitleCell = worksheet.getCell("A2");
      subTitleCell.value = `Periode: ${monthLabel} ${yearLabel} | Diunduh: ${format(new Date(), "dd MMMM yyyy, HH:mm")} | Total Data: ${filteredSales.length} Transaksi`;
      subTitleCell.font = { name: "Arial", size: 10, italic: true };
      subTitleCell.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getRow(2).height = 20;

      worksheet.addRow([]);

      const headerRow = worksheet.addRow([
        "No",
        "Waktu Transaksi",
        "No. Invoice",
        "Pelanggan",
        "Kasir",
        "Metode Bayar",
        "Status",
        "Subtotal (Rp)",
        "Diskon (Rp)",
        "Pajak (Rp)",
        "Total (Rp)",
      ]);
      headerRow.height = 26;

      headerRow.eachCell((cell) => {
        cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF10B981" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "medium" },
          right: { style: "thin" },
        };
      });

      filteredSales.forEach((sale: any, idx: number) => {
        const row = worksheet.addRow([
          idx + 1,
          format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm"),
          sale.invoiceNumber,
          sale.member?.name || sale.customerName || "Umum",
          sale.cashier?.name || "-",
          sale.paymentMethod,
          sale.status,
          sale.subtotal || 0,
          sale.discountAmount || 0,
          sale.taxAmount || 0,
          sale.total || 0,
        ]);

        row.height = 20;

        row.getCell(1).alignment = { horizontal: "center" };
        row.getCell(2).alignment = { horizontal: "center" };
        row.getCell(3).alignment = { horizontal: "center" };
        row.getCell(6).alignment = { horizontal: "center" };
        row.getCell(7).alignment = { horizontal: "center" };

        [8, 9, 10, 11].forEach((colIdx) => {
          row.getCell(colIdx).numFmt = "#,##0";
          row.getCell(colIdx).alignment = { horizontal: "right" };
        });

        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
          if (idx % 2 === 1) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
          }
        });
      });

      const totalRow = worksheet.addRow([
        "TOTAL",
        "",
        "",
        "",
        "",
        "",
        "",
        { formula: `SUM(H5:H${filteredSales.length + 4})` },
        { formula: `SUM(I5:I${filteredSales.length + 4})` },
        { formula: `SUM(J5:J${filteredSales.length + 4})` },
        { formula: `SUM(K5:K${filteredSales.length + 4})` },
      ]);
      totalRow.height = 24;

      worksheet.mergeCells(`A${filteredSales.length + 5}:G${filteredSales.length + 5}`);
      totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

      totalRow.eachCell((cell) => {
        cell.font = { name: "Arial", size: 11, bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
        cell.border = {
          top: { style: "medium" },
          bottom: { style: "double" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });

      [8, 9, 10, 11].forEach((colIdx) => {
        totalRow.getCell(colIdx).numFmt = "#,##0";
        totalRow.getCell(colIdx).alignment = { horizontal: "right", vertical: "middle" };
      });

      worksheet.columns = [
        { width: 6 },
        { width: 20 },
        { width: 22 },
        { width: 18 },
        { width: 16 },
        { width: 14 },
        { width: 12 },
        { width: 16 },
        { width: 14 },
        { width: 14 },
        { width: 18 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `Laporan_Transaksi_${monthLabel}_${yearLabel}_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`.replace(/\s+/g, "_");
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, fileName);

      toast.success("Laporan Excel berhasil diunduh!");
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error("Gagal mengekspor file Excel: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {showTitle && <h1 className="text-2xl font-extrabold text-gray-900">Riwayat Transaksi</h1>}
          <p className="text-xs sm:text-sm text-gray-500">
            {subTitle || (showFilters ? "Monitor dan filter seluruh riwayat transaksi kasir Anda" : "Daftar riwayat transaksi kasir Anda")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {showExportExcel && (
            <button
              onClick={handleExportExcel}
              disabled={isExporting || isLoading || filteredSales.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
              title="Export data yang terfilter ke file Excel (.xlsx)"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? "Mengekspor..." : "Export Excel"}</span>
            </button>
          )}

          {showLogout && user?.role !== 'OWNER' && (
            <button 
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red/10 text-red hover:bg-red/20 rounded-xl font-bold text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards (Optional) */}
      {showKpiCards && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-orange-pale text-orange flex items-center justify-center shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Jumlah Transaksi Terfilter</p>
              <p className="text-xl font-black text-gray-900">{filteredSales.length} <span className="text-xs font-normal text-gray-400">transaksi</span></p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-green-light text-green flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Omzet (Lunas)</p>
              <p className="text-xl font-black text-green">{formatIDR(totalAmount)}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Diskon Diberikan</p>
              <p className="text-xl font-black text-gray-800">{formatIDR(totalDiscount)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Toolbar (Optional) */}
      {showFilters && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>Filter Transaksi</span>
            </div>

            {(selectedMonth !== "ALL" || selectedYear !== "ALL" || selectedMethod !== "ALL" || selectedStatus !== "ALL" || searchQuery) && (
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-orange hover:text-orange-dark flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari No Invoice, Kasir, Member..."
                className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-gray-700 cursor-pointer"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-gray-700 cursor-pointer"
              >
                <option value="ALL">Semua Tahun</option>
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr.toString()}>
                    Tahun {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-gray-700 cursor-pointer"
              >
                <option value="ALL">Semua Pembayaran</option>
                <option value="CASH">Tunai (CASH)</option>
                <option value="QRIS">QRIS</option>
                <option value="TRANSFER">Transfer Bank</option>
                <option value="CARD">Kartu Debit/Kredit</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Transactions Table */}
      {isLoading ? (
        <div className="animate-pulse flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="w-full overflow-x-auto sm:overflow-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-2.5 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-gray-600">Waktu</th>
                  <th className="px-1.5 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-gray-600 text-center sm:text-left">
                    <span className="hidden md:inline">No. Invoice</span>
                    <span className="md:hidden">Metode</span>
                  </th>
                  <th className="p-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Pelanggan</th>
                  <th className="px-1.5 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-gray-600">Kasir</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Status</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Metode</th>
                  <th className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-gray-600 text-right">Total</th>
                  <th className="px-1.5 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-gray-600 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales?.map((sale: any) => {
                  const hasCustomer = !!(sale.member || (sale.customerName && sale.customerName.trim() && sale.customerName.toLowerCase() !== "umum"));
                  return (
                  <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-2.5 sm:px-4 py-2.5 sm:py-4">
                      <span className="hidden md:inline text-sm text-gray-700">
                        {format(new Date(sale.createdAt), "dd MMM yyyy, HH:mm")}
                      </span>
                      <div className="md:hidden leading-tight">
                        <p className="text-[11px] font-semibold text-gray-900 whitespace-nowrap">
                          {format(new Date(sale.createdAt), "dd/MM/yy")}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {format(new Date(sale.createdAt), "HH:mm")}
                        </p>
                      </div>
                    </td>
                    <td className="px-1.5 sm:px-4 py-2.5 sm:py-4 text-center sm:text-left">
                      <span className="hidden md:inline font-mono font-bold text-sm text-gray-800">
                        {sale.invoiceNumber}
                      </span>
                      <span className={`md:hidden inline-block px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                        hasCustomer 
                          ? 'bg-orange-pale text-orange border border-orange/20' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-700 hidden md:table-cell">
                      {sale.member ? (
                        <span className="bg-orange-pale text-orange px-2 py-0.5 rounded-lg text-xs font-bold">{sale.member.name}</span>
                      ) : (
                        <span className="text-gray-400">Umum</span>
                      )}
                    </td>
                    <td className="px-1.5 sm:px-4 py-2.5 sm:py-4 text-xs sm:text-sm text-gray-700">
                      <span className="truncate max-w-[55px] sm:max-w-none block font-medium" title={sale.cashier?.name || '-'}>
                        {sale.cashier?.name || '-'}
                      </span>
                    </td>
                    <td className={`p-4 text-sm font-bold hidden md:table-cell ${
                      sale.status === "PAID" ? "text-green" : 
                      sale.status === "CANCELLED" ? "text-red" : "text-orange"
                    }`}>
                      {sale.status}
                    </td>
                    <td className="p-4 text-sm text-gray-700 font-semibold hidden md:table-cell">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        hasCustomer 
                          ? 'bg-orange-pale text-orange border border-orange/20' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className={`px-2 sm:px-4 py-2.5 sm:py-4 text-right whitespace-nowrap`}>
                      <span className={`text-xs sm:text-sm font-extrabold ${
                        sale.status === "PAID" ? "text-green" : 
                        sale.status === "CANCELLED" ? "text-red" : "text-orange"
                      }`}>
                        {formatIDR(sale.total)}
                      </span>
                    </td>
                    <td className="px-1.5 sm:px-4 py-2.5 sm:py-4 text-center">
                      <div className="flex items-center justify-center">
                        <button 
                          className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-500 hover:text-white transition-colors"
                          title="Lihat Detail"
                          onClick={() => { setSelectedSale(sale); setIsModalOpen(true); }}
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3.5 sm:p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 bg-gray-50/30">
                <p className="text-xs text-gray-500 whitespace-nowrap">
                  Menampilkan <span className="font-bold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredSales.length)}</span> dari <span className="font-bold">{filteredSales.length}</span> transaksi
                </p>
                <div className="flex items-center gap-1.5 max-w-full">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none no-scrollbar py-0.5 max-w-[200px] sm:max-w-none">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                          currentPage === page 
                            ? 'bg-orange text-white border border-orange shadow-sm' 
                            : 'border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            {!filteredSales?.length && (
              <div className="p-12 text-center text-gray-400 space-y-2">
                <Receipt className="w-10 h-10 mx-auto text-gray-300" />
                <p className="font-medium text-sm">Tidak ada data transaksi.</p>
                {showFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-orange font-bold hover:underline"
                  >
                    Reset semua filter
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Detail Transaksi</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const iframe = document.createElement('iframe');
                    iframe.style.position = 'absolute';
                    iframe.style.width = '0';
                    iframe.style.height = '0';
                    iframe.style.border = 'none';
                    iframe.src = `/receipt/${selectedSale.id || selectedSale.offlineTempId}`;
                    document.body.appendChild(iframe);
                    setTimeout(() => { document.body.removeChild(iframe); }, 10000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange text-white hover:bg-orange-dark rounded-lg font-semibold text-xs sm:text-sm transition-colors"
                  title="Cetak Struk"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Cetak</span>
                </button>
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red hover:bg-red-100 rounded-lg font-semibold text-xs sm:text-sm transition-colors border border-red-200"
                  title="Hapus Transaksi"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Hapus</span>
                </button>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">No. Invoice</span>
                  <span className="text-sm font-bold text-gray-900 font-mono">{selectedSale.invoiceNumber}</span>
                </div>
                {selectedSale.member && (
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Pelanggan (Member)</span>
                    <span className="text-sm font-bold text-orange bg-orange-pale px-2 py-0.5 rounded-md">{selectedSale.member.name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`text-sm font-bold ${
                    selectedSale.status === "PAID" ? "text-green" : 
                    selectedSale.status === "CANCELLED" ? "text-red" : "text-orange"
                  }`}>
                    {selectedSale.status}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Metode Bayar</span>
                  <span className="text-sm font-bold text-gray-900">{selectedSale.paymentMethod}</span>
                </div>
                {selectedSale.paymentMethod === "CASH" && selectedSale.amountPaid > selectedSale.total && (
                  <>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Uang Diterima</span>
                      <span className="text-sm font-bold text-gray-900">{formatIDR(selectedSale.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Kembalian</span>
                      <span className="text-sm font-bold text-orange">{formatIDR(selectedSale.changeAmount)}</span>
                    </div>
                  </>
                )}
                
                <div className="pt-2">
                  <span className="text-sm font-bold text-gray-900 mb-2 block">Item Pembelian:</span>
                  <div className="space-y-2">
                    {selectedSale.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <div>
                          <div className="text-sm font-bold text-gray-900">{item.product?.name || "Produk dihapus"}</div>
                          <div className="text-xs text-gray-500">{item.quantity} x {formatIDR(item.unitPrice)}</div>
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {formatIDR(item.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl mt-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>Subtotal</span>
                    <span className="text-gray-900 font-semibold">{formatIDR(selectedSale.subtotal)}</span>
                  </div>
                  {selectedSale.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>Diskon</span>
                      <span className="text-red font-semibold">-{formatIDR(selectedSale.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-500 mb-3 pb-3 border-b border-gray-200">
                    <span>Pajak</span>
                    <span className="text-gray-900 font-semibold">{formatIDR(selectedSale.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-extrabold text-gray-900">
                    <span>Total</span>
                    <span className="text-orange">{formatIDR(selectedSale.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-red/10 text-red rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Konfirmasi Keluar</h3>
            <p className="text-gray-500 mb-6">Apakah Anda yakin ingin keluar dari sesi ini?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="flex-1 py-3 px-4 bg-red hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red/30"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Transaksi?</h3>
            <p className="text-gray-500 text-sm mb-4">
              Apakah Anda yakin ingin menghapus transaksi <span className="font-mono font-bold text-gray-800">{selectedSale.invoiceNumber}</span>?
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-800 mb-6 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Stok produk pada transaksi ini akan dikembalikan dan data akan dihapus dari sistem.</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteSale}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-red hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
