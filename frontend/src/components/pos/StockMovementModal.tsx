import { useState } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, ClipboardList, Plus, Minus, FileEdit } from "lucide-react";

export default function StockMovementModal({ 
  isOpen, 
  onClose,
  product 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  product: any;
}) {
  const queryClient = useQueryClient();
  const { data: movements, isLoading } = useQuery({
    queryKey: ["stock-movements", product?.id],
    queryFn: async () => {
      const res = await api.get(`/products/${product.id}/stock-movements`);
      return res.data.data;
    },
    enabled: isOpen && !!product?.id
  });

  const [type, setType] = useState("IN"); // IN, OUT, ADJUSTMENT
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const addMovementMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/products/${product.id}/stock-movements`, data);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Stok berhasil disesuaikan");
      queryClient.invalidateQueries({ queryKey: ["stock-movements", product?.id] });
      queryClient.invalidateQueries({ queryKey: ["all-products"] });
      setIsAdding(false);
      setQuantity("");
      setNotes("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menyesuaikan stok");
    }
  });

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let qty = parseInt(quantity.replace(/\D/g, ""));
    if (isNaN(qty) || qty <= 0) return toast.error("Kuantitas tidak valid");

    if (type === "OUT") qty = -qty;
    else if (type === "ADJUSTMENT") qty = qty; // Usually adjustment could be positive or negative, but we'll assume the user enters the delta. E.g. +5 or -5. Actually let's just keep type IN/OUT for simplicity, and ADJUSTMENT for specific overrides? Let's just use positive/negative qty based on IN/OUT.

    addMovementMutation.mutate({ type, quantity: qty, notes });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-orange" />
              Riwayat Stok & Opname
            </h2>
            <p className="text-sm text-gray-500 mt-1">{product.emoji} {product.name} (Stok Saat Ini: {product.stock !== null ? product.stock : 'Unlimited'})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full mb-6 border-2 border-dashed border-gray-300 hover:border-orange hover:bg-orange-pale/30 text-gray-500 hover:text-orange font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
            >
              <FileEdit className="w-5 h-5" />
              Lakukan Penyesuaian / Stock Opname
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="mb-6 p-5 bg-orange-pale/10 border border-orange/20 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Form Penyesuaian Stok</h3>
                <button type="button" onClick={() => setIsAdding(false)} className="text-sm text-gray-500 hover:text-gray-900">Batal</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Jenis Mutasi</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-orange focus:ring-0 transition-colors"
                  >
                    <option value="IN">Masuk (+)</option>
                    <option value="OUT">Keluar (-)</option>
                    <option value="ADJUSTMENT">Opname / Penyesuaian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-orange focus:ring-0 transition-colors"
                    placeholder="Contoh: 10"
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Keterangan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-orange focus:ring-0 transition-colors"
                  placeholder="Contoh: Barang datang / Barang rusak"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={addMovementMutation.isPending}
                className="w-full bg-orange hover:bg-orange-dark text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {addMovementMutation.isPending ? "Menyimpan..." : "Simpan Mutasi"}
              </button>
            </form>
          )}

          <h3 className="font-bold text-gray-900 mb-4">Riwayat Pergerakan</h3>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>)}
            </div>
          ) : (
            <div className="space-y-3">
              {movements?.map((m: any) => (
                <div key={m.id} className="p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-sm">{m.notes || m.type}</span>
                    <span className="text-xs text-gray-500 mt-1">Oleh: {m.user?.name} • {new Date(m.createdAt).toLocaleString('id-ID')}</span>
                  </div>
                  <div className={`font-black text-lg ${m.quantity > 0 ? 'text-green' : 'text-red'}`}>
                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                  </div>
                </div>
              ))}
              {!movements?.length && (
                <div className="text-center text-sm text-gray-500 py-8">Belum ada riwayat stok.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
