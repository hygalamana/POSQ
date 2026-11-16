
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { TrendingUp, ShoppingBag, DollarSign, Package, Download, X, Calendar, ChevronDown, ChevronLeft, ChevronRight, Clock, CreditCard, FileSpreadsheet } from "lucide-react";
import { exportFullReport } from "../lib/exportExcel";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TransactionHistoryView from "../components/transactions/TransactionHistoryView";

const calculateGrowth = (current: number, previous: number) => {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return ((current - previous) / previous) * 100;
};

const GrowthIndicator = ({ growth, invert = false }: { growth: number, invert?: boolean }) => {
  if (growth > 0) return <span className={`flex items-center text-xs font-bold mt-1 ${invert ? 'text-red' : 'text-green'}`}><TrendingUp className="w-3 h-3 mr-1" /> +{growth.toFixed(1)}% <span className="text-gray-400 font-normal ml-1">vs sblm</span></span>;
  if (growth < 0) return <span className={`flex items-center text-xs font-bold mt-1 ${invert ? 'text-green' : 'text-red'}`}><TrendingUp className="w-3 h-3 mr-1 rotate-180" /> {growth.toFixed(1)}% <span className="text-gray-400 font-normal ml-1">vs sblm</span></span>;
  return <span className="text-gray-400 text-xs mt-1 block">Tetap 0% vs sblm</span>;
};

const downloadCSV = (csvContent: string, fileName: string) => {
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function ReportsPage() {
  const [filterType, setFilterType] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  let queryStart = "";
  let queryEnd = "";
  
  const now = new Date();
  if (filterType === "today") {
    const today = new Date(now);
    queryStart = new Date(today.setHours(0,0,0,0)).toISOString();
    queryEnd = new Date(today.setHours(23,59,59,999)).toISOString();
  } else if (filterType === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    queryStart = new Date(y.setHours(0,0,0,0)).toISOString();
    queryEnd = new Date(y.setHours(23,59,59,999)).toISOString();
  } else if (filterType === "7days") {
    const y = new Date(now);
    y.setDate(y.getDate() - 6);
    queryStart = new Date(y.setHours(0,0,0,0)).toISOString();
    queryEnd = new Date(now.setHours(23,59,59,999)).toISOString();
  } else if (filterType === "30days") {
    const y = new Date(now);
    y.setDate(y.getDate() - 29);
    queryStart = new Date(y.setHours(0,0,0,0)).toISOString();
    queryEnd = new Date(now.setHours(23,59,59,999)).toISOString();
  } else if (filterType === "thisMonth") {
    const y = new Date(now);
    queryStart = new Date(y.getFullYear(), y.getMonth(), 1).toISOString();
    queryEnd = new Date(now.setHours(23,59,59,999)).toISOString();
  } else if (filterType === "thisYear") {
    const y = new Date(now);
    queryStart = new Date(y.getFullYear(), 0, 1).toISOString();
    queryEnd = new Date(now.setHours(23,59,59,999)).toISOString();
  } else if (filterType === "custom") {
    queryStart = customStart ? new Date(customStart + "T00:00:00").toISOString() : "";
    queryEnd = customEnd ? new Date(customEnd + "T23:59:59.999").toISOString() : "";
  }

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["reportsSummary", queryStart, queryEnd],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (queryStart) params.append("startDate", queryStart);
      if (queryEnd) params.append("endDate", queryEnd);
      const res = await api.get(`/reports/summary?${params.toString()}`);
      return res.data.data;
    },
    enabled: filterType !== "custom" || (!!customStart && !!customEnd),
  });

  const { data: cashflowHistory, isLoading: isLoadingCashflow } = useQuery({
    queryKey: ["reportsCashflow", queryStart, queryEnd],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (queryStart) params.append("startDate", queryStart);
      if (queryEnd) params.append("endDate", queryEnd);
      
      const [salesRes, cashflowRes] = await Promise.all([
        api.get(`/sales?${params.toString()}`),
        api.get(`/cashflow?${params.toString()}`)
      ]);

      const sales = salesRes.data.data;
      const cashflows = cashflowRes.data.data;

      let combined: any[] = [];
      
      sales.forEach((s: any) => {
        if (s.status === 'PAID') {
          combined.push({
            id: s.id,
            tanggal: new Date(s.createdAt),
            jenis: 'Pemasukan (Penjualan)',
            deskripsi: `Invoice ${s.invoiceNumber}`,
            jumlah: s.total,
            type: 'INCOME'
          });
        }
      });

      cashflows.forEach((c: any) => {
        combined.push({
          id: c.id,
          tanggal: new Date(c.date),
          jenis: c.type === 'INCOME' ? 'Pemasukan (Manual)' : 'Pengeluaran (Manual)',
          deskripsi: c.description,
          jumlah: c.amount,
          type: c.type
        });
      });

      combined.sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime());
      return combined;
    },
    enabled: filterType !== "custom" || (!!customStart && !!customEnd),
  });

  const [activeTab, setActiveTab] = useState("umum");
  const [cashflowPage, setCashflowPage] = useState(1);

  // Reset page when filter changes
  useEffect(() => {
    setCashflowPage(1);
  }, [queryStart, queryEnd]);

  const itemsPerPage = 10;
  const paginatedCashflow = cashflowHistory?.slice((cashflowPage - 1) * itemsPerPage, cashflowPage * itemsPerPage) || [];
  const totalCashflowPages = Math.ceil((cashflowHistory?.length || 0) / itemsPerPage);

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isCashflowModalOpen, setIsCashflowModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const formatIDR = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const handleExportFullReport = async () => {
    if (!summary?.summary) return toast.error("Data ringkasan tidak tersedia");
    try {
      setIsExporting(true);
      toast.loading("Menyiapkan laporan Excel lengkap...", { id: "export-full" });
      await exportFullReport(queryStart, queryEnd);
      toast.success("Laporan Excel berhasil diunduh! 🎉", { id: "export-full" });
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengekspor laporan", { id: "export-full" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportProduct = async () => {
    try {
      setIsExporting(true);
      toast.loading("Mengekspor produk...", { id: "export" });
      const res = await api.get("/products");
      const products = res.data.data;
      
      let csv = "Nama Produk,Kategori,Harga,Stok\n";
      products.forEach((p: any) => {
        csv += `"${p.name}","${p.category?.name || '-'}","${p.price}","${p.stock ?? 'Unlimited'}"\n`;
      });
      
      downloadCSV(csv, `Data_Produk_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success("Produk berhasil diekspor", { id: "export" });
      setIsExportMenuOpen(false);
    } catch (error) {
      toast.error("Gagal mengekspor produk", { id: "export" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCashflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportStartDate || !exportEndDate) return toast.error("Pilih tanggal awal dan akhir");

    try {
      setIsExporting(true);
      toast.loading("Mengekspor laporan cashflow...", { id: "export" });
      
      // Fetch sales and cashflows
      const [salesRes, cashflowRes] = await Promise.all([
        api.get(`/sales?startDate=${exportStartDate}T00:00:00.000Z&endDate=${exportEndDate}T23:59:59.999Z`),
        api.get(`/cashflow?startDate=${exportStartDate}T00:00:00.000Z&endDate=${exportEndDate}T23:59:59.999Z`)
      ]);

      const sales = salesRes.data.data;
      const cashflows = cashflowRes.data.data;

      let combined: any[] = [];
      
      sales.forEach((s: any) => {
        if (s.status === 'PAID') {
          combined.push({
            tanggal: new Date(s.createdAt),
            jenis: 'Pemasukan (Penjualan)',
            deskripsi: `Invoice ${s.invoiceNumber}`,
            jumlah: s.total
          });
        }
      });

      cashflows.forEach((c: any) => {
        combined.push({
          tanggal: new Date(c.date),
          jenis: c.type === 'INCOME' ? 'Pemasukan (Manual)' : 'Pengeluaran (Manual)',
          deskripsi: c.description,
          jumlah: c.type === 'INCOME' ? c.amount : -c.amount
        });
      });

      // Sort by date
      combined.sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime());

      let csv = "Tanggal,Jenis,Deskripsi,Jumlah\n";
      combined.forEach((item) => {
        csv += `"${item.tanggal.toISOString().split('T')[0]}","${item.jenis}","${item.deskripsi}","${item.jumlah}"\n`;
      });

      downloadCSV(csv, `Cashflow_${exportStartDate}_to_${exportEndDate}.csv`);
      toast.success("Cashflow berhasil diekspor", { id: "export" });
      setIsCashflowModalOpen(false);
      setIsExportMenuOpen(false);
    } catch (error) {
      toast.error("Gagal mengekspor cashflow", { id: "export" });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoadingSummary || isLoadingCashflow) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 bg-cream scrollbar-custom">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Dashboard Laporan</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse h-28 bg-white rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 bg-cream scrollbar-custom">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Dashboard Laporan</h1>
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2 sm:gap-4 border-b border-gray-200 w-full lg:w-auto overflow-x-auto scrollbar-none no-scrollbar">
          {["Umum", "Riwayat Transaksi", "Cashflow", "Analitik", "Shift"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-3 sm:px-4 py-3 border-b-2 font-bold text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.toLowerCase() ? 'border-orange text-orange' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {activeTab !== "riwayat transaksi" && (
          <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-between w-full sm:w-[200px] px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-semibold text-gray-700 hover:border-orange focus:outline-none focus:border-orange transition-colors shadow-sm text-sm gap-2"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange" />
                <span>
                  {{
                    today: "Hari ini",
                    yesterday: "Kemarin",
                    "7days": "7 Hari Terakhir",
                    "30days": "30 Hari Terakhir",
                    thisMonth: "Bulan ini",
                    thisYear: "Tahun ini",
                    custom: "Custom Tanggal",
                  }[filterType as string]}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterOpen && (
              <div className="absolute top-full right-0 mt-2 w-[200px] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20">
                {[
                  { value: "today", label: "Hari ini" },
                  { value: "yesterday", label: "Kemarin" },
                  { value: "7days", label: "7 Hari Terakhir" },
                  { value: "30days", label: "30 Hari Terakhir" },
                  { value: "thisMonth", label: "Bulan ini" },
                  { value: "thisYear", label: "Tahun ini" },
                  { value: "custom", label: "Custom Tanggal" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setFilterType(opt.value);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-orange/10 ${
                      filterType === opt.value ? 'bg-orange/5 text-orange' : 'text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {filterType === "custom" && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-orange w-full sm:w-auto"
              />
              <span className="text-gray-500 font-bold">-</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-orange w-full sm:w-auto"
              />
            </div>
          )}
        </div>
        )}
      </div>

      {/* UMUM TAB */}
      {activeTab === "umum" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Ringkasan Bisnis</h2>
            <button 
              onClick={handleExportFullReport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-cream text-orange font-bold text-sm rounded-xl hover:bg-orange/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Mengekspor...' : 'Export Laporan'}
            </button>
          </div>
          
          {/* Card Saldo (Memanjang di atas Pendapatan & Pendapatan Bersih) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
            <div className="bg-white p-4 md:p-5 rounded-2xl border-2 border-orange shadow-sm flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange/10 rounded-xl flex items-center justify-center text-orange shrink-0">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-semibold text-gray-500 mb-0.5 md:mb-1 leading-tight">Saldo</p>
                <p className="text-lg md:text-2xl font-extrabold text-gray-900 leading-tight">{formatIDR(summary?.summary?.allTimeBalance || 0)}</p>
              </div>
            </div>
          </div>

          {/* KPI Cards Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-3 md:mb-4">
        <div className="bg-white p-3 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="w-8 h-8 md:w-12 md:h-12 bg-green-light rounded-xl flex items-center justify-center text-green shrink-0">
            <DollarSign className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm font-semibold text-gray-500 mb-0.5 md:mb-1 leading-tight">Pendapatan</p>
            <p className="text-sm md:text-xl font-extrabold text-gray-900 leading-tight">{formatIDR(summary?.summary?.revenue || 0)}</p>
            <GrowthIndicator growth={calculateGrowth(summary?.summary?.revenue || 0, summary?.summary?.prevRevenue || 0)} />
          </div>
        </div>

        <div className="bg-white p-3 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="w-8 h-8 md:w-12 md:h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
            <DollarSign className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm font-semibold text-gray-500 mb-0.5 md:mb-1 leading-tight">Pendapatan Bersih (Laba)</p>
            <p className="text-sm md:text-xl font-extrabold text-gray-900 leading-tight">{formatIDR(summary?.summary?.netRevenue || 0)}</p>
            <GrowthIndicator growth={calculateGrowth(summary?.summary?.netRevenue || 0, summary?.summary?.prevNetRevenue || 0)} />
          </div>
        </div>

        <div className="bg-white p-3 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="w-8 h-8 md:w-12 md:h-12 bg-red-100 rounded-xl flex items-center justify-center text-red shrink-0">
            <TrendingUp className="w-4 h-4 md:w-6 md:h-6 rotate-180" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm font-semibold text-gray-500 mb-0.5 md:mb-1 leading-tight">Pengeluaran</p>
            <p className="text-sm md:text-xl font-extrabold text-gray-900 leading-tight">{formatIDR(summary?.summary?.expense || 0)}</p>
            <GrowthIndicator invert growth={calculateGrowth(summary?.summary?.expense || 0, summary?.summary?.prevExpense || 0)} />
          </div>
        </div>

        <div className="bg-white p-3 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="w-8 h-8 md:w-12 md:h-12 bg-orange-pale rounded-xl flex items-center justify-center text-orange shrink-0">
            <ShoppingBag className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm font-semibold text-gray-500 mb-0.5 md:mb-1 leading-tight">Jumlah Transaksi</p>
            <p className="text-sm md:text-xl font-extrabold text-gray-900 leading-tight">{summary?.summary?.transactions || 0}</p>
            <GrowthIndicator growth={calculateGrowth(summary?.summary?.transactions || 0, summary?.summary?.prevTransactions || 0)} />
          </div>
        </div>
        </div>

        {/* KPI Cards Row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-white p-3 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
              <ShoppingBag className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] md:text-sm font-semibold text-gray-500 mb-0.5 md:mb-1 leading-tight">Total Produk Terjual</p>
              <p className="text-sm md:text-xl font-extrabold text-gray-900 leading-tight">{summary?.summary?.itemsSold || 0} <span className="text-sm font-medium text-gray-500">item</span></p>
              <GrowthIndicator growth={calculateGrowth(summary?.summary?.itemsSold || 0, summary?.summary?.prevItemsSold || 0)} />
            </div>
          </div>

          <div className="bg-white p-3 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
              <DollarSign className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] md:text-sm font-semibold text-gray-500 mb-0.5 md:mb-1 leading-tight">Rata-rata Transaksi</p>
              <p className="text-sm md:text-xl font-extrabold text-gray-900 leading-tight">
                {formatIDR((summary?.summary?.revenue || 0) / (summary?.summary?.transactions || 1))}
              </p>
              <GrowthIndicator growth={calculateGrowth((summary?.summary?.revenue || 0) / (summary?.summary?.transactions || 1), (summary?.summary?.prevRevenue || 0) / (summary?.summary?.prevTransactions || 1))} />
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 bg-white p-3 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 shrink-0">
              <TrendingUp className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] md:text-sm font-semibold text-gray-500 mb-0.5 md:mb-1 leading-tight">Margin Keuntungan</p>
              <p className="text-sm md:text-xl font-extrabold text-gray-900 leading-tight">
                {((summary?.summary?.revenue || 0) > 0 ? (summary?.summary?.netRevenue || 0) / summary.summary.revenue * 100 : 0).toFixed(1)}%
              </p>
              <GrowthIndicator growth={calculateGrowth((summary?.summary?.revenue || 0) > 0 ? (summary?.summary?.netRevenue || 0) / summary.summary.revenue : 0, (summary?.summary?.prevRevenue || 0) > 0 ? (summary?.summary?.prevNetRevenue || 0) / summary.summary.prevRevenue : 0)} />
            </div>
          </div>
        </div>
        </>
      )}

      {/* ANALITIK TAB */}
      {activeTab === "analitik" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Grafik Pendapatan</h2>
          <div className="h-[400px] w-full">
            {summary?.chartData && summary.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    dy={10}
                  />
                  <YAxis 
                    tickFormatter={(val) => `Rp${val / 1000}k`} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    width={50}
                  />
                  <Tooltip 
                    cursor={{ fill: '#fff7ed' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-gray-900 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-lg">
                            <div className="mb-1 text-gray-300 font-normal">
                              {new Date(payload[0].payload.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })}
                            </div>
                            {formatIDR(payload[0].value as number)}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" fill="#ff7a00" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Tidak ada data
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Products */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex-shrink-0">Produk Terlaris</h2>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-custom">
              {summary?.topProducts?.map((prod: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 pb-3 border-b border-gray-50 last:border-0">
                  <div className="w-10 h-10 bg-orange-pale rounded-lg flex items-center justify-center text-xl shrink-0">
                    {prod.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-bold text-gray-900 truncate">{prod.name}</h4>
                    <p className="text-[12px] text-gray-500">{prod.quantity} terjual</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-extrabold text-orange">{formatIDR(prod.revenue)}</p>
                  </div>
                </div>
              ))}
              {!summary?.topProducts?.length && (
                <p className="text-gray-500 text-center py-4">Belum ada data penjualan.</p>
              )}
            </div>
          </div>

          {/* Jam Ramai */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex-shrink-0">Jam Ramai</h2>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-custom">
              {summary?.busiestHours?.map((hour: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 pb-3 border-b border-gray-50 last:border-0">
                  <div className="w-10 h-10 bg-orange/10 rounded-lg flex items-center justify-center text-orange shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-bold text-gray-900">{hour.hour}</h4>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                      <div className="bg-orange h-1.5 rounded-full" style={{ width: `${Math.min(100, (hour.count / (summary.busiestHours[0]?.count || 1)) * 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-extrabold text-gray-900">{hour.count}</p>
                    <p className="text-[10px] text-gray-500">transaksi</p>
                  </div>
                </div>
              ))}
              {!summary?.busiestHours?.length && (
                <p className="text-gray-500 text-center py-4">Belum ada data transaksi.</p>
              )}
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex-shrink-0">Metode Pembayaran</h2>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-custom">
              {summary?.paymentMethods?.map((pm: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 pb-3 border-b border-gray-50 last:border-0">
                  <div className="w-10 h-10 bg-green-light rounded-lg flex items-center justify-center text-green shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-bold text-gray-900">{pm.method}</h4>
                    <p className="text-[12px] text-gray-500">{pm.transactions} transaksi</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-extrabold text-gray-900">{formatIDR(pm.revenue)}</p>
                  </div>
                </div>
              ))}
              {!summary?.paymentMethods?.length && (
                <p className="text-gray-500 text-center py-4">Belum ada data pembayaran.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* RIWAYAT TRANSAKSI TAB */}
      {activeTab === "riwayat transaksi" && (
        <div className="mt-1">
          <TransactionHistoryView 
            showTitle={false} 
            showLogout={false} 
            showExportExcel={true}
            showKpiCards={true}
            showFilters={true}
            subTitle="Laporan lengkap, filter periode, dan ekspor data transaksi penjualan"
          />
        </div>
      )}

      {/* CASHFLOW TAB */}
      {activeTab === "cashflow" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Riwayat Arus Kas</h2>
            <button 
              onClick={() => setIsCashflowModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cream text-orange font-bold text-sm rounded-xl hover:bg-orange/10 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Waktu</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Jenis</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Deskripsi</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedCashflow.length > 0 ? (
                  paginatedCashflow.map((item: any, idx: number) => (
                    <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <p className="text-sm font-bold text-gray-900">
                          {new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(item.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.jenis.includes('Pemasukan') 
                            ? 'bg-green-light text-green'
                            : 'bg-red-100 text-red'
                        }`}>
                          {item.jenis}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-700 max-w-[200px] md:max-w-md truncate">{item.deskripsi}</p>
                      </td>
                      <td className="p-4 whitespace-nowrap text-right">
                        <p className={`text-sm font-extrabold ${item.type === 'INCOME' ? 'text-green' : 'text-red'}`}>
                          {item.type === 'INCOME' ? '+' : '-'}{formatIDR(item.jumlah)}
                        </p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-sm text-gray-500">
                      Tidak ada riwayat arus kas pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalCashflowPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500 whitespace-nowrap">
                Menampilkan <span className="font-bold">{(cashflowPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold">{Math.min(cashflowPage * itemsPerPage, cashflowHistory?.length || 0)}</span> dari <span className="font-bold">{cashflowHistory?.length || 0}</span> riwayat
              </p>
              <div className="flex items-center gap-2 max-w-full">
                <button
                  onClick={() => setCashflowPage(prev => Math.max(1, prev - 1))}
                  disabled={cashflowPage === 1}
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                  {Array.from({ length: totalCashflowPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCashflowPage(page)}
                      className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                        cashflowPage === page 
                          ? 'bg-orange text-white border border-orange' 
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCashflowPage(prev => Math.min(totalCashflowPages, prev + 1))}
                  disabled={cashflowPage === totalCashflowPages}
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}



      {/* Cashflow Date Filter Modal */}
      {isCashflowModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Filter Waktu Cashflow</h2>
              <button onClick={() => setIsCashflowModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleExportCashflow} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Akhir</label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange bg-gray-50 focus:bg-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isExporting}
                className="w-full mt-4 bg-orange text-white font-bold py-3 px-4 rounded-xl hover:bg-orange-dark transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isExporting ? "Mengekspor..." : <><Download className="w-5 h-5" /> Unduh Laporan</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SHIFT TAB */}
      {activeTab === "shift" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <ShiftReportTable queryStart={queryStart} queryEnd={queryEnd} />
        </div>
      )}
    </div>
  );
}

function ShiftReportTable({ queryStart, queryEnd }: { queryStart: string, queryEnd: string }) {
  const { data: shifts, isLoading } = useQuery({
    queryKey: ["reportsShifts", queryStart, queryEnd],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (queryStart) params.append("startDate", queryStart);
      if (queryEnd) params.append("endDate", queryEnd);
      const res = await api.get(`/shifts?${params.toString()}`);
      return res.data.data;
    }
  });

  if (isLoading) return (
    <>
      <div className="p-4 md:p-6 border-b border-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">Laporan Shift (Buka/Tutup Kasir)</h2>
      </div>
      <div className="p-4 md:p-6">
        <div className="text-center py-10">Memuat data shift...</div>
      </div>
    </>
  );

  const formatIDR = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const handleExport = () => {
    if (!shifts || shifts.length === 0) return toast.error("Tidak ada data shift");
    let csv = "Waktu Buka,Waktu Tutup,Kasir,Modal Awal,Total Penjualan,Uang Fisik,Selisih,Status\n";
    shifts.forEach((shift: any) => {
      const difference = shift.status === 'CLOSED' ? (shift.actualBalance || 0) - (shift.endBalance || 0) : null;
      const sales = shift.endBalance ? shift.endBalance - shift.startBalance : 0;
      csv += `"${new Date(shift.startTime).toLocaleString('id-ID')}","${shift.endTime ? new Date(shift.endTime).toLocaleString('id-ID') : '-'}","${shift.cashier?.name || '-'}","${shift.startBalance}","${sales}","${shift.actualBalance || '-'}","${difference !== null ? difference : '-'}","${shift.status === 'CLOSED' ? 'Ditutup' : 'Aktif'}"\n`;
    });
    downloadCSV(csv, `ShiftReport_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success("Berhasil mengekspor data shift");
  };

  return (
    <>
      <div className="p-4 md:p-6 border-b border-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">Laporan Shift (Buka/Tutup Kasir)</h2>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-cream text-orange font-bold text-sm rounded-xl hover:bg-orange/10 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>
      <div className="p-4 md:p-6">
        <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100">
            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Waktu Buka</th>
            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Waktu Tutup</th>
            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Kasir</th>
            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Modal Awal</th>
            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Total Penjualan</th>
            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Uang Fisik Akhir</th>
            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Selisih</th>
            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50" id="shift-data">
          {shifts?.map((shift: any) => {
            const difference = shift.status === 'CLOSED' ? (shift.actualBalance || 0) - (shift.endBalance || 0) : null;
            const sales = shift.endBalance ? shift.endBalance - shift.startBalance : 0;
            return (
            <tr key={shift.id} className="hover:bg-orange/5 transition-colors">
              <td className="p-4 text-sm font-medium text-gray-900">
                {new Date(shift.startTime).toLocaleString('id-ID')}
              </td>
              <td className="p-4 text-sm text-gray-500">
                {shift.endTime ? new Date(shift.endTime).toLocaleString('id-ID') : '-'}
              </td>
              <td className="p-4 text-sm text-gray-900">{shift.cashier?.name}</td>
              <td className="p-4 text-sm text-gray-900">{formatIDR(shift.startBalance)}</td>
              <td className="p-4 text-sm text-gray-900">{shift.status === 'CLOSED' ? formatIDR(sales) : '-'}</td>
              <td className="p-4 text-sm text-gray-900">{shift.status === 'CLOSED' && shift.actualBalance !== null ? formatIDR(shift.actualBalance) : '-'}</td>
              <td className="p-4 text-sm">
                {difference === null ? '-' : (
                  <span className={`font-bold ${difference > 0 ? 'text-green' : difference < 0 ? 'text-red' : 'text-gray-900'}`}>
                    {difference > 0 ? '+' : ''}{formatIDR(difference)}
                  </span>
                )}
              </td>
              <td className="p-4 text-sm">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${shift.status === 'CLOSED' ? 'bg-green/10 text-green' : 'bg-orange/10 text-orange'}`}>
                  {shift.status === 'CLOSED' ? 'Ditutup' : 'Aktif'}
                </span>
              </td>
            </tr>
          )})}
          {!shifts?.length && (
            <tr>
              <td colSpan={8} className="p-8 text-center text-gray-500 text-sm">
                Tidak ada data shift untuk periode ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>
        </div>
      </div>
    </>
  );
}
