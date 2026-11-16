import { useState } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, X } from "lucide-react";

export default function CloseShiftModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: activeShift } = useQuery({
    queryKey: ["active-shift"],
    queryFn: async () => {
      const res = await api.get("/shifts/active");
      return res.data.data;
    },
    enabled: isOpen
  });

  const [actualBalance, setActualBalance] = useState<string>("");

  const closeShiftMutation = useMutation({
    mutationFn: async (balance: number) => {
      const res = await api.post("/shifts/close", { actualBalance: balance });
      return res.data.data;
    },
    onSuccess: (data) => {
      // check if there is a discrepancy
      const diff = data.actualBalance - data.endBalance;
      if (diff === 0) {
        toast.success("Shift ditutup! Saldo laci sesuai.");
      } else if (diff < 0) {
        toast.error(`Shift ditutup! Terdapat KEKURANGAN uang kasir sebesar Rp ${Math.abs(diff).toLocaleString('id-ID')}`, { duration: 6000 });
      } else {
        toast.success(`Shift ditutup! Terdapat KELEBIHAN uang kasir sebesar Rp ${diff.toLocaleString('id-ID')}`, { duration: 6000 });
      }
      queryClient.invalidateQueries({ queryKey: ["active-shift"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menutup shift");
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseInt(actualBalance.replace(/\D/g, ""));
    if (isNaN(balance) || balance < 0) {
      return toast.error("Masukkan nominal yang valid");
    }
    closeShiftMutation.mutate(balance);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <LogOut className="w-5 h-5 text-red" />
            Tutup Kasir
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4 text-sm text-gray-600 bg-orange-pale/30 p-4 rounded-xl border border-orange-pale">
            Hitung sisa uang fisik yang ada di dalam laci kasir saat ini, lalu masukkan jumlahnya di bawah ini untuk dicocokkan dengan sistem.
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Total Uang Fisik di Laci (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
              <input
                type="text"
                value={actualBalance}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setActualBalance(val ? parseInt(val).toLocaleString('id-ID') : "");
                }}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-red focus:ring-0 text-xl font-bold transition-colors"
                placeholder="0"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={closeShiftMutation.isPending}
            className="w-full bg-red hover:bg-red-600 text-white font-bold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 text-lg shadow-lg shadow-red/30"
          >
            {closeShiftMutation.isPending ? "Menyimpan..." : "Tutup & Cocokkan Kasir"}
          </button>
        </form>
      </div>
    </div>
  );
}
