
import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { useCategories } from "../../hooks/useCategories";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product?: any; // If editing
  onDelete?: () => void;
}

export default function ProductModal({ isOpen, onClose, product, onDelete }: Props) {
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    hpp: "",
    emoji: "🍔",
    categoryId: "",
    stock: "",
    sku: "",
    variants: [] as { name: string; price: string; hpp: string }[],
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price.toString(),
        hpp: product.hpp ? product.hpp.toString() : "",
        emoji: product.emoji || "🍔",
        categoryId: product.categoryId,
        stock: product.stock !== null ? product.stock.toString() : "",
        sku: product.sku || "",
        variants: product.variants?.map((v: any) => ({ name: v.name, price: v.price.toString(), hpp: v.hpp ? v.hpp.toString() : "" })) || [],
      });
    } else {
      setFormData({ name: "", price: "", hpp: "", emoji: "🍔", categoryId: categories?.[0]?.id || "", stock: "", sku: "", variants: [] });
    }
  }, [product, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.categoryId) {
      return toast.error("Mohon lengkapi data produk");
    }

    try {
      setIsLoading(true);
      const payload = {
        name: formData.name,
        price: Number(formData.price),
        hpp: formData.hpp ? Number(formData.hpp) : 0,
        emoji: formData.emoji,
        categoryId: formData.categoryId,
        stock: formData.stock ? Number(formData.stock) : null,
        sku: formData.sku || null,
        isActive: true,
        variants: formData.variants.filter((v) => v.name && v.price).map(v => ({ ...v, hpp: v.hpp ? Number(v.hpp) : 0 })),
      };

      if (product) {
        await api.put(`/products/${product.id}`, payload);
        toast.success("Produk berhasil diperbarui");
      } else {
        await api.post("/products", payload);
        toast.success("Produk berhasil ditambahkan");
      }
      
      queryClient.invalidateQueries({ queryKey: ["all-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{product ? "Edit Produk" : "Tambah Produk Baru"}</h2>
          <div className="flex items-center gap-2">
            {product && onDelete && (
              <button type="button" onClick={onDelete} className="p-2 hover:bg-red/10 rounded-lg text-red transition-colors" title="Hapus Produk">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Produk</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange transition-colors"
              placeholder="Contoh: Nasi Goreng Spesial"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Harga Jual (Rp)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange transition-colors"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">HPP / Modal (Rp)</label>
              <input
                type="number"
                value={formData.hpp}
                onChange={(e) => setFormData({ ...formData, hpp: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange transition-colors"
                placeholder="0 (Opsional)"
              />
            </div>
          </div>

          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">Variasi Produk (Opsional)</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, variants: [...formData.variants, { name: "", price: formData.price || "", hpp: formData.hpp || "" }] })}
                className="text-xs font-bold text-orange hover:text-orange-dark transition-colors"
              >
                + Tambah Variasi
              </button>
            </div>
            {formData.variants.map((v, i) => (
              <div key={i} className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  placeholder="Nama Varian"
                  value={v.name}
                  onChange={(e) => {
                    const newV = [...formData.variants];
                    newV[i].name = e.target.value;
                    setFormData({ ...formData, variants: newV });
                  }}
                  className="w-1/3 px-2 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-orange transition-colors text-xs"
                />
                <input
                  type="number"
                  placeholder="Harga"
                  value={v.price}
                  onChange={(e) => {
                    const newV = [...formData.variants];
                    newV[i].price = e.target.value;
                    setFormData({ ...formData, variants: newV });
                  }}
                  className="flex-1 px-2 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-orange transition-colors text-xs"
                />
                <input
                  type="number"
                  placeholder="HPP"
                  value={v.hpp}
                  onChange={(e) => {
                    const newV = [...formData.variants];
                    newV[i].hpp = e.target.value;
                    setFormData({ ...formData, variants: newV });
                  }}
                  className="flex-1 px-2 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-orange transition-colors text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newV = formData.variants.filter((_, idx) => idx !== i);
                    setFormData({ ...formData, variants: newV });
                  }}
                  className="w-8 flex-shrink-0 flex items-center justify-center bg-red/10 text-red hover:bg-red/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange transition-colors bg-white"
              >
                <option value="" disabled>Pilih Kategori</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Emoji / Ikon</label>
              <input
                type="text"
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange transition-colors text-center text-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Stok (Opsional)</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange transition-colors"
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">SKU / Kode (Opsional)</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange transition-colors"
                placeholder="Contoh: NS-GRG-01"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange hover:bg-orange-dark text-white font-bold py-3.5 rounded-xl mt-4 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center shadow-lg shadow-orange/20"
          >
            {isLoading ? "Menyimpan..." : "Simpan Produk"}
          </button>
        </form>
      </div>
    </div>
  );
}
