
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { format } from "date-fns";
import { Plus, ArrowLeft, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import Link from '@/lib/routerCompat';
import { useState } from "react";
import toast from "react-hot-toast";

export default function CashflowPage() {
  const { data: cashflows, isLoading, refetch } = useQuery({
    queryKey: ["cashflows"],
    queryFn: async () => {
      const res = await api.get("/cashflow");
      return res.data.data;
    },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatIDR = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return toast.error("Semua kolom harus diisi");

    try {
      setIsSubmitting(true);
      await api.post("/cashflow", { type, amount: Number(amount), description });
      toast.success("Catatan berhasil ditambahkan");
      setIsModalOpen(false);
      setAmount("");
      setDescription("");
      refetch();
    } catch (error) {
      toast.error("Gagal menambahkan catatan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus catatan ini?")) {
      try {
        await api.delete(`/cashflow/${id}`);
        toast.success("Catatan dihapus");
        refetch();
      } catch (error) {
        toast.error("Gagal menghapus");
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 bg-cream scrollbar-custom">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings" className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900 flex-1">Manajemen Arus Kas</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange hover:bg-orange-dark text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Tambah Catatan</span>
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-sm font-semibold text-gray-600">Tanggal</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Deskripsi</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-right">Jumlah</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {cashflows?.map((item: any) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm text-gray-700">
                      {format(new Date(item.date), "dd MMM yyyy, HH:mm")}
                    </td>
                    <td className="p-4 text-sm font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        {item.type === "INCOME" ? (
                          <TrendingUp className="w-4 h-4 text-green" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red" />
                        )}
                        {item.description}
                      </div>
                    </td>
                    <td className={`p-4 text-sm font-extrabold text-right ${item.type === "INCOME" ? "text-green" : "text-red"}`}>
                      {item.type === "INCOME" ? "+" : "-"}{formatIDR(item.amount)}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red/10 text-red hover:bg-red hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!cashflows?.length && (
              <div className="p-8 text-center text-gray-500">Belum ada catatan arus kas manual.</div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Tambah Catatan Arus Kas</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType("EXPENSE")}
                    className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors ${type === "EXPENSE" ? "bg-red text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  >
                    <TrendingDown className="w-4 h-4" /> Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("INCOME")}
                    className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors ${type === "INCOME" ? "bg-green text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  >
                    <TrendingUp className="w-4 h-4" /> Pemasukan
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah (Rp)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange bg-gray-50 focus:bg-white"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange bg-gray-50 focus:bg-white"
                  placeholder="Contoh: Belanja bahan baku sayur"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 bg-orange text-white font-bold py-3 px-4 rounded-xl hover:bg-orange-dark transition-colors disabled:opacity-70"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Catatan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
