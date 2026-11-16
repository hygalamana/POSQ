import { useState } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, X } from "lucide-react";

import { useAuthStore } from "../../stores/authStore";
import { useRouter } from '@/lib/routerCompat';

export default function ShiftModal({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: activeShift, isLoading, refetch } = useQuery({
    queryKey: ["active-shift"],
    queryFn: async () => {
      const res = await api.get("/shifts/active");
      return res.data.data;
    },
    // Don't retry so we quickly show the modal if no active shift
    retry: false,
    refetchOnWindowFocus: false,
  });

  const [startBalance, setStartBalance] = useState<string>("");

  const openShiftMutation = useMutation({
    mutationFn: async (balance: number) => {
      const res = await api.post("/shifts/open", { startBalance: balance });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Shift berhasil dibuka!");
      queryClient.invalidateQueries({ queryKey: ["active-shift"] });
      if (onClose) onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal membuka shift");
    }
  });

  const forceOpen = !activeShift && (!user || user.role === 'CASHIER');
  const showModal = isOpen || forceOpen;

  if (isLoading) return null;
  if (!showModal) return null; // Shift is active or not forced/requested

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseInt(startBalance.replace(/\D/g, ""));
    if (isNaN(balance) || balance < 0) {
      return toast.error("Masukkan nominal yang valid");
    }
    openShiftMutation.mutate(balance);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-8 text-center border-b border-gray-100 relative">
          {onClose && !forceOpen && (
            <button onClick={onClose} className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="w-16 h-16 bg-orange-pale rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-orange" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Buka Kasir</h2>
          <p className="text-gray-500">Silakan masukkan jumlah uang kembalian (modal awal) yang ada di laci kasir Anda saat ini.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Modal Awal Laci (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
              <input
                type="text"
                value={startBalance}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setStartBalance(val ? parseInt(val).toLocaleString('id-ID') : "");
                }}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-orange focus:ring-0 text-xl font-bold transition-colors"
                placeholder="0"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={openShiftMutation.isPending}
            className="w-full bg-orange hover:bg-orange-dark text-white font-bold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 text-lg shadow-lg shadow-orange/30 mb-3"
          >
            {openShiftMutation.isPending ? "Membuka Shift..." : "Mulai Jualan"}
          </button>
          
          {user?.role === 'CASHIER' && (
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 px-6 rounded-2xl transition-all text-sm"
            >
              Keluar Akun (Logout)
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
