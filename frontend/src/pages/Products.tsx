
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { Plus, Edit, Trash2, Download, Upload, Filter, FolderPlus } from "lucide-react";
import toast from "react-hot-toast";
import { useState, useRef, useMemo } from "react";
import ProductModal from "../components/pos/ProductModal";
import CategoryModal from "../components/pos/CategoryModal";
import StockMovementModal from "../components/pos/StockMovementModal";
import { ClipboardList } from "lucide-react";

export default function ProductsManagementPage() {
  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ["all-products"],
    queryFn: async () => {
      const res = await api.get("/products");
      return res.data.data;
    },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data.data;
    },
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (selectedCategoryId === "ALL") return products;
    return products.filter((p: any) => p.categoryId === selectedCategoryId);
  }, [products, selectedCategoryId]);

  const handleExportCSV = () => {
    if (!filteredProducts?.length) return toast.error("Tidak ada data produk untuk diexport");
    
    const headers = ["Nama Produk", "Kategori", "Harga", "HPP", "Stok", "SKU", "Emoji", "Deskripsi"];
    const csvContent = filteredProducts.map((p: any) => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category?.name || '').replace(/"/g, '""')}"`,
      p.price || 0,
      p.hpp || 0,
      p.stock !== null ? p.stock : "",
      `"${(p.sku || '').replace(/"/g, '""')}"`,
      `"${(p.emoji || '').replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`
    ].join(","));
    
    const finalCsv = headers.join(",") + "\n" + csvContent.join("\n");
    const blob = new Blob([finalCsv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Data_Produk_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split("\n").filter(row => row.trim());
        if (rows.length < 2) return toast.error("File CSV kosong atau tidak valid");
        
        const dataRows = rows.slice(1);
        let successCount = 0;
        
        toast.loading("Mengimpor produk...", { id: "import" });
        
        for (const row of dataRows) {
          const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/^"|"$/g, '')) || [];
          
          if (cols.length >= 3) {
            const name = cols[0];
            const categoryName = cols[1];
            const price = parseFloat(cols[2]) || 0;
            const hpp = parseFloat(cols[3]) || 0;
            const stock = cols[4] ? parseInt(cols[4]) : null;
            const sku = cols[5] || "";
            const emoji = cols[6] || "📦";
            const description = cols[7] || "";
            
            const category = categories?.find((c: any) => c.name.toLowerCase() === categoryName?.toLowerCase());
            const categoryId = category?.id || categories?.[0]?.id;

            if (!categoryId) {
               continue; // Cannot insert without category
            }
            
            await api.post("/products", {
              name, price, hpp, stock, sku, emoji, description, categoryId
            });
            successCount++;
          }
        }
        
        toast.success(`${successCount} produk berhasil diimpor`, { id: "import" });
        refetch();
      } catch (error) {
        toast.error("Gagal mengimpor produk", { id: "import" });
      }
      
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus produk ${name}?`)) {
      try {
        await api.delete(`/products/${id}`);
        toast.success("Produk berhasil dihapus");
        refetch();
      } catch (error) {
        toast.error("Gagal menghapus produk");
      }
    }
  };

  const formatIDR = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 bg-cream scrollbar-custom">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Manajemen Produk</h1>
        
        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 w-full md:w-auto">
          {/* Hidden File Input */}
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
            className="hidden" 
          />

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors text-sm"
            title="Import CSV"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          
          <button 
            onClick={handleExportCSV}
            className="w-full sm:w-auto justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors text-sm"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>

          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="w-full sm:w-auto justify-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors text-sm"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Kategori</span>
          </button>

          <button 
            onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}
            className="w-full sm:w-auto justify-center bg-orange hover:bg-orange-dark text-white px-3 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Produk</span>
          </button>
        </div>
      </div>

      {/* Filter Kategori */}
      <div className="mb-6 flex items-center gap-2">
        <Filter className="w-5 h-5 text-gray-400" />
        <select 
          value={selectedCategoryId} 
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-orange focus:border-orange block p-2.5 outline-none"
        >
          <option value="ALL">Semua Kategori</option>
          {categories?.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="animate-pulse flex flex-col gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-sm font-semibold text-gray-600">Produk</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Kategori</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Harga</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Stok</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts?.map((product: any) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-pale rounded-lg flex items-center justify-center text-xl shrink-0">
                          {product.emoji}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{product.name}</p>
                          {product.sku && <p className="text-xs text-gray-500">SKU: {product.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700 hidden md:table-cell">
                      {product.category?.name || '-'}
                    </td>
                    <td className="p-4 text-sm text-gray-700 font-medium hidden md:table-cell">
                      {formatIDR(product.price)}
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {product.stock !== null ? product.stock : 'Unlimited'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-orange hover:text-white transition-colors flex items-center justify-center"
                          title="Riwayat Stok"
                          onClick={() => { setSelectedProduct(product); setIsStockModalOpen(true); }}
                        >
                          <ClipboardList className="w-4 h-4" />
                        </button>
                        <button 
                          className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center"
                          title="Edit Produk"
                          onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredProducts?.length && (
              <div className="p-8 text-center text-gray-500">Belum ada produk.</div>
            )}
          </div>
        </div>
      )}

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={selectedProduct} 
        onDelete={selectedProduct ? () => {
          handleDelete(selectedProduct.id, selectedProduct.name);
          setIsModalOpen(false);
        } : undefined}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={() => { refetchCategories(); }}
      />

      <StockMovementModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}
