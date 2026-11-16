import { useState, useEffect } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Settings, Check } from "lucide-react";

export default function PointsSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: outlet } = useQuery({
    queryKey: ["outlet-points-settings"],
    queryFn: async () => {
      const res = await api.get("/outlets");
      return res.data.data;
    },
    enabled: isOpen
  });

  const [pointsEnabled, setPointsEnabled] = useState(false);
  const [pointsRate, setPointsRate] = useState<string>("");

  useEffect(() => {
    if (outlet) {
      setPointsEnabled(outlet.pointsEnabled);
      setPointsRate(outlet.pointsRate ? outlet.pointsRate.toLocaleString('id-ID') : "");
    }
  }, [outlet]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.patch("/outlets/points", data);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Pengaturan poin berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: ["outlet-points-settings"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menyimpan pengaturan");
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseInt(pointsRate.replace(/\D/g, "")) || 0;
    saveMutation.mutate({ pointsEnabled, pointsRate: rate });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            Pengaturan Sistem Poin
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${pointsEnabled ? 'bg-orange border-orange' : 'border-gray-300'}`}>
                {pointsEnabled && <Check className="w-4 h-4 text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={pointsEnabled} 
                onChange={(e) => setPointsEnabled(e.target.checked)} 
              />
              <div>
                <div className="font-bold text-gray-900">Aktifkan Sistem Poin</div>
                <div className="text-sm text-gray-500">Berikan poin setiap pelanggan berbelanja</div>
              </div>
            </label>
          </div>

          <div className={`transition-opacity ${pointsEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <label className="block text-sm font-bold text-gray-700 mb-2">Rasio Poin (Rp)</label>
            <div className="text-sm text-gray-500 mb-3">Setiap pelanggan belanja senilai ini, mereka akan mendapatkan 1 Poin.</div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
              <input
                type="text"
                value={pointsRate}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setPointsRate(val ? parseInt(val).toLocaleString('id-ID') : "");
                }}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange focus:ring-0 text-lg transition-colors"
                placeholder="Contoh: 10.000"
                required={pointsEnabled}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full mt-8 bg-orange hover:bg-orange-dark text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saveMutation.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </form>
      </div>
    </div>
  );
}
